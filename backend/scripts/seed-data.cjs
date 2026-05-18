/**
 * Database Seed Script — Populates categories & products
 * Run: node scripts/seed-data.cjs
 * 
 * Prerequisites: Backend must be running on localhost:5000
 *                Admin must be set up (run setup-admin.cjs first)
 */
const http = require('http');

// ── Admin credentials (from setup-admin.cjs) ──
const ADMIN_EMAIL = 'admin@tficlub.com';
const ADMIN_PASSWORD = 'Admin@123';

let accessTokenCookie = '';

function apiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(accessTokenCookie ? { Cookie: accessTokenCookie } : {}),
      },
    }, res => {
      let data = '';
      const cookies = res.headers['set-cookie'] || [];
      // Extract access_token cookie
      for (const c of cookies) {
        if (c.startsWith('access_token=')) {
          accessTokenCookie = c.split(';')[0];
        }
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── Categories ──
const CATEGORIES = [
  { name: 'T-Shirts', slug: 't-shirts', description: 'Premium cinema-inspired t-shirts with high-density prints' },
  { name: 'Hoodies', slug: 'hoodies', description: 'Cozy hoodies featuring iconic Telugu cinema designs' },
  { name: 'Oversized', slug: 'oversized', description: 'Relaxed fit oversized tees for effortless streetwear style' },
  { name: 'Caps', slug: 'caps', description: 'Streetwear caps with embroidered cinema motifs' },
  { name: 'Posters', slug: 'posters', description: 'Premium art posters celebrating Telugu film culture' },
  { name: 'Stickers', slug: 'stickers', description: 'Vinyl stickers featuring iconic movie dialogues and characters' },
];

// ── Products ──
function getProducts(categoryMap) {
  return [
    // T-Shirts
    {
      name: 'Pushpa Iconic Dialogue Tee',
      slug: 'pushpa-iconic-dialogue-tee',
      description: 'Unleash the Pushpa attitude with this premium cotton tee featuring the iconic "Thaggede Le" dialogue in bold typographic design. Made with 100% bio-washed cotton for ultimate comfort.',
      price: 799,
      comparePrice: 1299,
      images: ['https://placehold.co/800x1000/1a1a2e/ffffff?text=Pushpa+Tee'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Black', 'White'],
      categoryId: categoryMap['t-shirts'],
      stock: 45,
      featured: true,
      bestseller: true,
      newArrival: false,
      tags: ['pushpa', 'dialogue', 'allu arjun'],
      gender: 'UNISEX',
    },
    {
      name: 'Baahubali Crown Tee',
      slug: 'baahubali-crown-tee',
      description: 'Wear the legacy of Mahishmati with this regal Baahubali-inspired design. Features a detailed crown motif with metallic print accents on premium heavyweight cotton.',
      price: 899,
      comparePrice: 1499,
      images: ['https://placehold.co/800x1000/0a1628/d4af37?text=Baahubali+Crown'],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Black', 'Blue'],
      categoryId: categoryMap['t-shirts'],
      stock: 30,
      featured: true,
      bestseller: false,
      newArrival: true,
      tags: ['baahubali', 'prabhas', 'crown'],
      gender: 'MEN',
    },
    {
      name: 'RRR Fire & Water Tee',
      slug: 'rrr-fire-water-tee',
      description: 'Celebrate the epic bond of Bheem and Rama with this dual-element design. Water and fire merge in a stunning gradient print that captures the spirit of RRR.',
      price: 849,
      comparePrice: 1399,
      images: ['https://placehold.co/800x1000/8b0000/ff6347?text=RRR+Fire+Water'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Black', 'Red'],
      categoryId: categoryMap['t-shirts'],
      stock: 38,
      featured: true,
      bestseller: true,
      newArrival: false,
      tags: ['rrr', 'rajamouli', 'ntr', 'ram charan'],
      gender: 'UNISEX',
    },
    // Hoodies
    {
      name: 'Arjun Reddy Vintage Hoodie',
      slug: 'arjun-reddy-vintage-hoodie',
      description: 'Raw, intense, unforgettable. This heavyweight hoodie features a distressed vintage print inspired by the cult classic. 400 GSM French terry cotton with kangaroo pocket.',
      price: 1899,
      comparePrice: 2999,
      images: ['https://placehold.co/800x1000/2d1b69/e0e0e0?text=Arjun+Reddy+Hoodie'],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Black', 'White'],
      categoryId: categoryMap['hoodies'],
      stock: 20,
      featured: true,
      bestseller: true,
      newArrival: false,
      tags: ['arjun reddy', 'vijay deverakonda', 'hoodie'],
      gender: 'MEN',
    },
    {
      name: 'Eega Minimal Hoodie',
      slug: 'eega-minimal-hoodie',
      description: 'A minimalist take on the most creative Telugu film ever made. Features a subtle fly silhouette with neon accents. Premium 380 GSM organic cotton blend.',
      price: 1799,
      comparePrice: 2799,
      images: ['https://placehold.co/800x1000/1a1a2e/00ff88?text=Eega+Hoodie'],
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: ['Black'],
      categoryId: categoryMap['hoodies'],
      stock: 15,
      featured: false,
      bestseller: false,
      newArrival: true,
      tags: ['eega', 'rajamouli', 'minimal'],
      gender: 'UNISEX',
    },
    {
      name: 'Tollywood Classics Hoodie',
      slug: 'tollywood-classics-hoodie',
      description: 'A tribute to the golden era of Telugu cinema. Features vintage movie poster collage print on premium fleece-lined hoodie. Perfect for movie nights and casual outings.',
      price: 1999,
      comparePrice: 3199,
      images: ['https://placehold.co/800x1000/3d0c11/ffd700?text=Classics+Hoodie'],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Black', 'Red'],
      categoryId: categoryMap['hoodies'],
      stock: 22,
      featured: true,
      bestseller: false,
      newArrival: true,
      tags: ['tollywood', 'classics', 'vintage'],
      gender: 'UNISEX',
    },
    // Oversized
    {
      name: 'Kalki 2898 AD Oversized Tee',
      slug: 'kalki-2898-oversized-tee',
      description: 'Step into the future with this sci-fi inspired oversized tee. Features futuristic typography and holographic accents. Drop shoulder cut in 240 GSM cotton.',
      price: 999,
      comparePrice: 1599,
      images: ['https://placehold.co/800x1000/0d0d0d/00bfff?text=Kalki+2898'],
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: ['Black', 'White'],
      categoryId: categoryMap['oversized'],
      stock: 35,
      featured: true,
      bestseller: false,
      newArrival: true,
      tags: ['kalki', 'prabhas', 'sci-fi', 'oversized'],
      gender: 'UNISEX',
    },
    {
      name: 'Jersey Nani Oversized Tee',
      slug: 'jersey-nani-oversized-tee',
      description: 'Inspired by the emotional journey of Arjun in Jersey. Features a cricket bat silhouette with motivational script. Relaxed oversized fit in premium bio-washed cotton.',
      price: 949,
      comparePrice: 1499,
      images: ['https://placehold.co/800x1000/1a3c5e/ffffff?text=Jersey+Oversized'],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Blue', 'White'],
      categoryId: categoryMap['oversized'],
      stock: 28,
      featured: false,
      bestseller: true,
      newArrival: false,
      tags: ['jersey', 'nani', 'cricket'],
      gender: 'MEN',
    },
    {
      name: 'Mahanati Art Oversized Tee',
      slug: 'mahanati-art-oversized-tee',
      description: 'A beautiful watercolor-style tribute to the legendary Savitri. Delicate floral accents meet vintage cinema aesthetics. Premium soft-touch fabric with relaxed fit.',
      price: 1049,
      comparePrice: 1699,
      images: ['https://placehold.co/800x1000/4a1942/ffb6c1?text=Mahanati+Art'],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Black', 'White'],
      categoryId: categoryMap['oversized'],
      stock: 25,
      featured: false,
      bestseller: false,
      newArrival: true,
      tags: ['mahanati', 'savitri', 'art', 'women'],
      gender: 'WOMEN',
    },
    // Caps
    {
      name: 'TFI Classic Snapback',
      slug: 'tfi-classic-snapback',
      description: 'The signature TFICLUB snapback cap with embroidered logo. Structured 6-panel design with adjustable snap closure. One size fits most.',
      price: 599,
      comparePrice: 999,
      images: ['https://placehold.co/800x1000/1a1a2e/ffffff?text=TFI+Snapback'],
      sizes: [],
      colors: ['Black', 'White', 'Red'],
      categoryId: categoryMap['caps'],
      stock: 50,
      featured: false,
      bestseller: true,
      newArrival: false,
      tags: ['cap', 'snapback', 'tfi'],
      gender: 'UNISEX',
    },
    {
      name: 'Cinema Director Cap',
      slug: 'cinema-director-cap',
      description: 'Channel your inner director with this premium dad cap. Features "DIRECTOR" embroidery with clapperboard detail. Washed cotton with brass buckle closure.',
      price: 649,
      comparePrice: 1099,
      images: ['https://placehold.co/800x1000/2c2c2c/ffd700?text=Director+Cap'],
      sizes: [],
      colors: ['Black', 'Blue'],
      categoryId: categoryMap['caps'],
      stock: 40,
      featured: false,
      bestseller: false,
      newArrival: true,
      tags: ['cap', 'director', 'cinema'],
      gender: 'UNISEX',
    },
    {
      name: 'Tollywood Star Trucker Cap',
      slug: 'tollywood-star-trucker-cap',
      description: 'A mesh-back trucker cap with a bold star emblem representing Tollywood fame. Breathable design perfect for outdoor wear with adjustable snapback.',
      price: 549,
      comparePrice: 899,
      images: ['https://placehold.co/800x1000/0d2137/ffffff?text=Star+Trucker'],
      sizes: [],
      colors: ['Black', 'White'],
      categoryId: categoryMap['caps'],
      stock: 60,
      featured: false,
      bestseller: false,
      newArrival: false,
      tags: ['cap', 'trucker', 'star'],
      gender: 'UNISEX',
    },
    // Posters
    {
      name: 'Pushpa Theatrical Poster',
      slug: 'pushpa-theatrical-poster',
      description: 'High-quality art print of the iconic Pushpa theatrical poster. Printed on 300 GSM matte art paper with fade-resistant inks. Size: A2 (420×594mm).',
      price: 399,
      comparePrice: 699,
      images: ['https://placehold.co/800x1000/2d1b00/ff8c00?text=Pushpa+Poster'],
      sizes: ['A3', 'A2', 'A1'],
      colors: [],
      categoryId: categoryMap['posters'],
      stock: 100,
      featured: false,
      bestseller: true,
      newArrival: false,
      tags: ['poster', 'pushpa', 'art print'],
      gender: 'UNISEX',
    },
    {
      name: 'RRR Naacho Naacho Art Print',
      slug: 'rrr-naacho-naacho-art-print',
      description: 'A vibrant artistic interpretation of the legendary Naacho Naacho dance sequence. Bold colors and dynamic composition on premium art paper.',
      price: 449,
      comparePrice: 799,
      images: ['https://placehold.co/800x1000/8b0000/ffd700?text=RRR+Art+Print'],
      sizes: ['A3', 'A2'],
      colors: [],
      categoryId: categoryMap['posters'],
      stock: 80,
      featured: false,
      bestseller: false,
      newArrival: true,
      tags: ['poster', 'rrr', 'dance', 'art'],
      gender: 'UNISEX',
    },
    {
      name: 'Baahubali Kingdom Poster',
      slug: 'baahubali-kingdom-poster',
      description: 'An epic panoramic view of the Mahishmati kingdom rendered in stunning detail. Gallery-quality giclée print on archival paper.',
      price: 499,
      comparePrice: 899,
      images: ['https://placehold.co/800x1000/0a1628/c0c0c0?text=Mahishmati+Kingdom'],
      sizes: ['A3', 'A2', 'A1'],
      colors: [],
      categoryId: categoryMap['posters'],
      stock: 70,
      featured: false,
      bestseller: false,
      newArrival: false,
      tags: ['poster', 'baahubali', 'kingdom'],
      gender: 'UNISEX',
    },
    // Stickers
    {
      name: 'TFI Dialogue Sticker Pack',
      slug: 'tfi-dialogue-sticker-pack',
      description: 'Pack of 10 premium vinyl stickers featuring iconic Telugu cinema dialogues. Waterproof, UV-resistant, and perfect for laptops, bottles, and notebooks.',
      price: 199,
      comparePrice: 399,
      images: ['https://placehold.co/800x1000/1a1a2e/ff6b6b?text=Dialogue+Stickers'],
      sizes: [],
      colors: [],
      categoryId: categoryMap['stickers'],
      stock: 200,
      featured: false,
      bestseller: true,
      newArrival: false,
      tags: ['stickers', 'dialogue', 'pack'],
      gender: 'UNISEX',
    },
    {
      name: 'Cinema Icons Sticker Set',
      slug: 'cinema-icons-sticker-set',
      description: 'A curated set of 15 holographic stickers featuring stylized portraits of Telugu cinema legends. Premium die-cut vinyl with holographic finish.',
      price: 249,
      comparePrice: 499,
      images: ['https://placehold.co/800x1000/2d1b69/e0e0e0?text=Cinema+Icons'],
      sizes: [],
      colors: [],
      categoryId: categoryMap['stickers'],
      stock: 150,
      featured: false,
      bestseller: false,
      newArrival: true,
      tags: ['stickers', 'icons', 'holographic'],
      gender: 'UNISEX',
    },
  ];
}

async function main() {
  console.log('\n🎬 TFICLUB — Database Seed Script\n');
  console.log('════════════════════════════════════════\n');

  // Step 1: Login as admin
  console.log('1. Logging in as admin...');
  const loginRes = await apiRequest('POST', '/auth/admin/signin', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (loginRes.status >= 400) {
    console.error('   ❌ Admin login failed:', loginRes.data?.message || loginRes.data);
    console.error('   → Run "node scripts/setup-admin.cjs" first!');
    process.exit(1);
  }
  console.log('   ✅ Logged in as:', loginRes.data?.user?.email);

  // Step 2: Check existing categories
  console.log('\n2. Checking existing categories...');
  const existingCats = await apiRequest('GET', '/categories');
  if (existingCats.data?.length > 0) {
    console.log(`   ℹ️  Found ${existingCats.data.length} existing categories.`);
  }

  // Step 3: Create categories
  console.log('\n3. Creating categories...');
  const categoryMap = {};

  // First, map existing categories
  if (Array.isArray(existingCats.data)) {
    for (const cat of existingCats.data) {
      categoryMap[cat.slug] = cat.id;
    }
  }

  for (const cat of CATEGORIES) {
    if (categoryMap[cat.slug]) {
      console.log(`   ⏭️  "${cat.name}" already exists`);
      continue;
    }
    const res = await apiRequest('POST', '/categories', cat);
    if (res.status >= 400) {
      console.error(`   ❌ Failed to create "${cat.name}":`, res.data?.message || res.data);
      continue;
    }
    categoryMap[cat.slug] = res.data.id;
    console.log(`   ✅ Created "${cat.name}" (${res.data.id})`);
  }

  // Step 4: Check existing products
  console.log('\n4. Checking existing products...');
  const existingProds = await apiRequest('GET', '/products?limit=100');
  const existingSlugs = new Set(
    (existingProds.data?.products || []).map(p => p.slug)
  );

  if (existingSlugs.size > 0) {
    console.log(`   ℹ️  Found ${existingSlugs.size} existing products.`);
  }

  // Step 5: Create products
  console.log('\n5. Creating products...');
  const products = getProducts(categoryMap);
  let created = 0;
  let skipped = 0;

  for (const product of products) {
    if (!product.categoryId) {
      console.error(`   ❌ Skipping "${product.name}": No category ID`);
      continue;
    }
    if (existingSlugs.has(product.slug)) {
      console.log(`   ⏭️  "${product.name}" already exists`);
      skipped++;
      continue;
    }
    const res = await apiRequest('POST', '/products', product);
    if (res.status >= 400) {
      console.error(`   ❌ Failed to create "${product.name}":`, res.data?.message || res.data);
      continue;
    }
    console.log(`   ✅ Created "${product.name}" — ₹${product.price}`);
    created++;
  }

  // Summary
  console.log('\n════════════════════════════════════════');
  console.log('  SEED COMPLETE');
  console.log('════════════════════════════════════════');
  console.log(`  Categories: ${Object.keys(categoryMap).length}`);
  console.log(`  Products created: ${created}`);
  console.log(`  Products skipped: ${skipped}`);
  console.log('════════════════════════════════════════\n');
  console.log('  → Frontend: http://localhost:5173');
  console.log('  → Admin:    http://localhost:5174\n');
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
