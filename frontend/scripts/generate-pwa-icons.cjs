/**
 * Generate PWA icons (192x192, 512x512, 512x512 maskable) with zero
 * dependencies — pure Node (zlib) PNG encoding.
 * Run: node scripts/generate-pwa-icons.cjs (frontend is an ESM package)
 *
 * Design: dark background with a bold yellow ring (FANCLUB brand accent).
 * The maskable icon keeps the motif inside the safe-zone (80% center circle).
 */
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

let CRC_TABLE = null;
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

/** RGBA pixel data for a single icon. `maskable` keeps art inside safe zone. */
function renderPixels(size, maskable) {
  const px = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;

  // Art circle radius (slightly smaller for maskable so nothing gets cropped)
  const artRadius = size * (maskable ? 0.30 : 0.36);
  const holeRadius = artRadius * 0.45;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist2 = dx * dx + dy * dy;

      // Background
      px[i] = 0x12; px[i + 1] = 0x12; px[i + 2] = 0x16; px[i + 3] = 255;

      if (dist2 <= artRadius * artRadius) {
        if (dist2 >= holeRadius * holeRadius) {
          // Yellow ring
          px[i] = 0xff; px[i + 1] = 0xd7; px[i + 2] = 0x00; px[i + 3] = 255;
        }
      }
    }
  }
  return px;
}

function makeIcon(size, outPath, maskable) {
  const px = renderPixels(size, maskable);
  const stride = size * 4;
  const raw = Buffer.alloc(size * (stride + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: None
    px.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);

  fs.writeFileSync(outPath, png);
  console.log(`✓ ${outPath} (${size}x${size}, ${png.length} bytes)`);
}

const publicDir = path.join(__dirname, '..', 'public');
makeIcon(192, path.join(publicDir, 'icon-192.png'), false);
makeIcon(512, path.join(publicDir, 'icon-512.png'), false);
makeIcon(512, path.join(publicDir, 'icon-maskable-512.png'), true);
console.log('\nDone. Icons written to public/.');
