/**
 * Direct Database Seed Script
 * Connects directly to Supabase via Prisma and pg driver, bypassing REST APIs and Supabase Auth.
 * Run: node scripts/direct-seed.js
 */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const CATEGORIES = [
  { name: 'T-Shirts', slug: 't-shirts', description: 'Premium cinema-inspired t-shirts with high-density prints' },
  { name: 'Hoodies', slug: 'hoodies', description: 'Cozy hoodies featuring iconic Telugu cinema designs' },
  { name: 'Oversized', slug: 'oversized', description: 'Relaxed fit oversized tees for effortless streetwear style' },
  { name: 'Caps', slug: 'caps', description: 'Streetwear caps with embroidered cinema motifs' },
  { name: 'Posters', slug: 'posters', description: 'Premium art posters celebrating Telugu film culture' },
  { name: 'Stickers', slug: 'stickers', description: 'Vinyl stickers featuring iconic movie dialogues and characters' },
];

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
  console.log('\n🎬 TFICLUB — Direct Database Seeder\n');
  console.log('Connecting to database...');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$connect();
    console.log('Connected successfully via Prisma PG adapter.\n');

    // 1. Clear existing products & categories to avoid collisions
    console.log('Clearing existing products and categories...');
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    console.log('Database tables cleared.\n');

    // 2. Create Categories
    console.log('Seeding categories...');
    const categoryMap = {};
    for (const cat of CATEGORIES) {
      const created = await prisma.category.create({
        data: cat,
      });
      categoryMap[cat.slug] = created.id;
      console.log(`  ✅ Category created: ${created.name} (${created.id})`);
    }

    // 3. Create Products
    console.log('\nSeeding products...');
    const products = getProducts(categoryMap);
    let count = 0;
    for (const prod of products) {
      const created = await prisma.product.create({
        data: prod,
      });
      count++;
      console.log(`  ✅ Product created: ${created.name} (₹${created.price})`);
    }

    console.log(`\n🎉 Seed completed successfully! Created ${CATEGORIES.length} categories and ${count} products.`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
    console.log('Database connection closed.');
  }
}

main();
