/**
 * Uploads Migration Script
 *
 * Migrates legacy disk-based uploads (backend/public/uploads) to durable
 * Supabase Storage and rewrites every database reference.
 *
 * Background: image uploads previously wrote files to ./public/uploads on the
 * backend's local disk. That disk is ephemeral on Render/Cloud Run — files
 * are lost on every redeploy and are not shared across instances, so
 * storefront images referenced as /public/uploads/... break in production.
 * This script uploads those local files to Supabase Storage (public buckets)
 * and rewrites the stored URLs to permanent public URLs.
 *
 * Run (from backend/):
 *   node scripts/migrate-uploads.js          # migrate
 *   node scripts/migrate-uploads.js --dry-run  # preview only, no changes
 *
 * The script is idempotent — re-running only processes rows that still
 * reference /public/uploads/ paths. Files missing from the local disk are
 * skipped with a warning and their DB references are left untouched.
 */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const DRY_RUN = process.argv.includes('--dry-run');
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');
const DISK_PREFIX = '/public/uploads/';
const AUDIT_FILE = path.join(
  __dirname,
  `migrate-uploads-${new Date().toISOString().slice(0, 10)}.jsonl`,
);
// Audit trail: (table, rowId, field, oldValue, newValue) per change
const auditLog = [];

const MIME_BY_EXT = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// "bucket:filename" -> publicUrl cache so a file referenced by many rows uploads once
const urlCache = new Map();

async function ensureBucket(bucket) {
  const { data: existing } = await supabase.storage.getBucket(bucket);
  if (!existing) {
    const { error } = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
    });
    if (error && !String(error.message).toLowerCase().includes('already exists')) {
      throw new Error(`Could not create bucket "${bucket}": ${error.message}`);
    }
  }
}

/** Upload one disk file. Returns public URL or null if the file is missing. */
async function migrateFileUrl(diskUrl, bucket, context = '') {
  // Only flat legacy paths like /public/uploads/<file> are migrated.
  const m = /^\/public\/uploads\/([^/]+)$/.exec(diskUrl);
  if (!m) return null; // not a legacy disk path — leave unchanged
  const filename = m[1];
  const cacheKey = `${bucket}:${filename}`;
  if (urlCache.has(cacheKey)) return urlCache.get(cacheKey);

  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️  MISSING FILE on disk — skipped: ${diskUrl}${context ? ` (${context})` : ''}`);
    return null;
  }

  const buffer = fs.readFileSync(filePath);
  const ext = (path.extname(filename) || '.jpg').slice(1).toLowerCase();
  const contentType = MIME_BY_EXT[ext] || 'image/jpeg';
  // Deterministic path so re-runs overwrite the same object instead of duplicating
  const storagePath = `migrated/${filename}`;

  if (DRY_RUN) {
    console.log(`  🔎 would upload ${filename} (${(buffer.length / 1024).toFixed(0)} KB) -> ${bucket}/${storagePath}${context ? ` (${context})` : ''}`);
    return null;
  }

  await ensureBucket(bucket);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, buffer, { contentType, upsert: true, cacheControl: '3600' });
  if (error) throw new Error(`Upload failed for ${filename}: ${error.message}`);

  const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
  urlCache.set(cacheKey, publicUrl);
  console.log(`  ✅ ${filename} -> ${publicUrl}${context ? ` (${context})` : ''}`);
  return publicUrl;
}

/** Replace all disk URLs in an array with Supabase public URLs. */
async function migrateArray(urls, bucket, context = '') {
  if (!Array.isArray(urls)) return urls;
  const out = [];
  let changed = false;
  for (const u of urls) {
    if (typeof u === 'string' && /^\/public\/uploads\//.test(u)) {
      const nu = await migrateFileUrl(u, bucket, context);
      if (nu) {
        out.push(nu);
        changed = true;
      } else {
        out.push(u); // file missing — keep original (don't break the row)
      }
    } else {
      out.push(u);
    }
  }
  return changed ? out : null;
}

async function main() {
  console.log(`\n🧰 FANCLUB — Uploads Migration${DRY_RUN ? ' (DRY RUN — no changes)' : ''}\n`);
  if (DRY_RUN) {
    console.log('ℹ️  Files on disk:');
    if (fs.existsSync(UPLOADS_DIR)) {
      fs.readdirSync(UPLOADS_DIR).forEach((f) => console.log(`   - ${f}`));
    } else {
      console.log('   (no uploads directory)');
    }
    console.log('');
  }

  let uploaded = 0;
  let rowsUpdated = 0;

  // ── Products ──
  const products = await prisma.product.findMany({ select: { id: true, name: true, images: true } });
  for (const p of products) {
    if (!p.images.some((i) => i.includes(DISK_PREFIX))) continue;
    const newImages = await migrateArray(p.images, 'products', `product ${p.name}`);
    if (newImages) {
      if (!DRY_RUN) await prisma.product.update({ where: { id: p.id }, data: { images: newImages } });
      auditLog.push({ table: 'products', rowId: p.id, field: 'images', oldValue: p.images, newValue: newImages });
      rowsUpdated++;
      console.log(`  📦 Product "${p.name}" images migrated.`);
    }
  }

  // ── Settings (about image + hero images) ──
  const settings = await prisma.setting.findMany();
  for (const s of settings) {
    let value = s.value;
    if (s.key === 'about_image_url' && typeof value === 'string' && value.includes(DISK_PREFIX)) {
      const nu = await migrateFileUrl(value, 'settings', `setting ${s.key}`);
      if (nu && !DRY_RUN) await prisma.setting.update({ where: { key: s.key }, data: { value: nu } });
      if (nu) {
        auditLog.push({ table: 'settings', rowId: s.key, field: 'value', oldValue: value, newValue: nu });
        rowsUpdated++;
        console.log(`  🖼️  Setting "${s.key}" migrated.`);
      }
    } else if (s.key === 'hero_images_urls' && Array.isArray(value) && value.some((v) => typeof v === 'string' && v.includes(DISK_PREFIX))) {
      const newUrls = await migrateArray(value, 'settings', `setting ${s.key}`);
      if (newUrls) {
        if (!DRY_RUN) await prisma.setting.update({ where: { key: s.key }, data: { value: newUrls } });
        auditLog.push({ table: 'settings', rowId: s.key, field: 'value', oldValue: value, newValue: newUrls });
        rowsUpdated++;
        console.log(`  🖼️  Setting "${s.key}" migrated (${value.length} → ${newUrls.length} images).`);
      }
    }
  }

  // ── Categories ──
  const categories = await prisma.category.findMany({ select: { id: true, name: true, image: true } });
  for (const c of categories) {
    if (!c.image || !c.image.includes(DISK_PREFIX)) continue;
    const nu = await migrateFileUrl(c.image, 'settings', `category ${c.name}`);
    if (nu) {
      if (!DRY_RUN) await prisma.category.update({ where: { id: c.id }, data: { image: nu } });
      auditLog.push({ table: 'categories', rowId: c.id, field: 'image', oldValue: c.image, newValue: nu });
      rowsUpdated++;
      console.log(`  🗂️  Category "${c.name}" image migrated.`);
    }
  }

  // ── Users (avatars) ──
  const users = await prisma.user.findMany({ select: { id: true, email: true, avatar: true } });
  for (const u of users) {
    if (!u.avatar || !u.avatar.includes(DISK_PREFIX)) continue;
    const nu = await migrateFileUrl(u.avatar, 'avatars', `user ${u.email}`);
    if (nu) {
      if (!DRY_RUN) await prisma.user.update({ where: { id: u.id }, data: { avatar: nu } });
      auditLog.push({ table: 'users', rowId: u.id, field: 'avatar', oldValue: u.avatar, newValue: nu });
      rowsUpdated++;
      console.log(`  👤 User "${u.email}" avatar migrated.`);
    }
  }

  // ── Order Items (historical snapshots) ──
  const orderItems = await prisma.orderItem.findMany({ select: { id: true, image: true } });
  for (const oi of orderItems) {
    if (!oi.image || !oi.image.includes(DISK_PREFIX)) continue;
    const nu = await migrateFileUrl(oi.image, 'products', `order item ${oi.id}`);
    if (nu) {
      if (!DRY_RUN) await prisma.orderItem.update({ where: { id: oi.id }, data: { image: nu } });
      auditLog.push({ table: 'order_items', rowId: oi.id, field: 'image', oldValue: oi.image, newValue: nu });
      rowsUpdated++;
      console.log(`  🧾 Order item ${oi.id} image migrated.`);
    }
  }

  if (!DRY_RUN && auditLog.length > 0) {
    fs.writeFileSync(AUDIT_FILE, auditLog.map((l) => JSON.stringify(l)).join('\n') + '\n', 'utf-8');
    console.log(`📝 Audit trail written to ${AUDIT_FILE}`);
  }

  console.log(
    `\n🎉 Done${DRY_RUN ? ' (dry run)' : ''} — ${rowsUpdated} row(s) updated, ${urlCache.size} unique file(s) uploaded.\n`,
  );
}

main()
  .catch((e) => {
    console.error('\n❌ Migration failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
