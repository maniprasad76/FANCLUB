/**
 * Settings Backfill Script (CRIT 3 migration)
 *
 * Migrates the legacy file-backed store config (backend/data/settings.json)
 * into the DB-backed `settings` table introduced by CRIT 3.
 *
 * Run: node scripts/backfill-settings.js
 *
 * The script is idempotent — safe to re-run. Rows that already exist in
 * the DB are SKIPPED, so config set via the admin panel always wins over
 * the legacy file values.
 */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const LEGACY_FILE = path.join(__dirname, '../data/settings.json');

async function main() {
  console.log('\n⚙️  FANCLUB — Settings Backfill (CRIT 3)\n');

  // 1. Read legacy file (may not exist on fresh checkouts — that's fine)
  if (!fs.existsSync(LEGACY_FILE)) {
    console.log(`ℹ️  No legacy file at ${LEGACY_FILE} — nothing to backfill.`);
    return;
  }
  const legacy = JSON.parse(fs.readFileSync(LEGACY_FILE, 'utf-8'));
  const keys = Object.keys(legacy);
  if (keys.length === 0) {
    console.log('ℹ️  Legacy settings file is empty — nothing to backfill.');
    return;
  }
  console.log(`📄 Found ${keys.length} legacy setting(s): ${keys.join(', ')}`);

  // 2. Connect
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$connect();
    console.log('Connected successfully via Prisma PG adapter.\n');

    // 3. Create missing keys; skip any that already exist so admin-set
    //    config (post-migration) is never overwritten by legacy values.
    let created = 0;
    let skipped = 0;
    for (const key of keys) {
      const existing = await prisma.setting.findUnique({ where: { key } });
      if (existing) {
        skipped++;
        console.log(`  ⏭️  Skipped (already set): ${key}`);
      } else {
        await prisma.setting.create({ data: { key, value: legacy[key] } });
        created++;
        console.log(`  ✅ Created setting: ${key}`);
      }
    }

    console.log(
      `\n🎉 Backfill complete! ${created} created, ${skipped} skipped.`,
    );
    console.log(
      '💡 The legacy data/settings.json can now be deleted if desired.',
    );
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
    console.log('Database connection closed.');
  }
}

main();
