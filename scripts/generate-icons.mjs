// Generates placeholder PNG icons for the manifest at public/assets/.
// Each icon is a solid-colored square with a centered white "P" glyph drawn
// from a fixed bitmap. Run via `npm run icons`.
//
// PNG output is hand-rolled (deflate + CRC) so we don't pull in a runtime
// dependency just for icon generation.

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync, crc32 } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '..', 'public', 'assets');

const BG = [0x21, 0x6c, 0xc4]; // ppt-tools blue
const FG = [0xff, 0xff, 0xff];

// 8x8 bitmap of the letter "P" (1 = foreground, 0 = background).
const GLYPH = [
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 0, 0, 1, 1, 0],
  [0, 1, 1, 0, 0, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 0, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

function buildPixels(size) {
  const pixels = Buffer.alloc(size * size * 3);
  // Center the 8x8 glyph, scaled by floor(size / 10) for some padding.
  const scale = Math.max(1, Math.floor(size / 10));
  const glyphSide = 8 * scale;
  const offset = Math.floor((size - glyphSide) / 2);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = Math.floor((x - offset) / scale);
      const gy = Math.floor((y - offset) / scale);
      const inGlyph = gx >= 0 && gx < 8 && gy >= 0 && gy < 8 && GLYPH[gy] && GLYPH[gy][gx] === 1;
      const [r, g, b] = inGlyph ? FG : BG;
      const i = (y * size + x) * 3;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
    }
  }
  return pixels;
}

function chunk(type, data) {
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crc]);
}

function encodePng(size) {
  const pixels = buildPixels(size);
  // Each scanline gets a leading filter-type byte (0 = None).
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    pixels.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  }
  const compressed = deflateSync(raw);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

await mkdir(outDir, { recursive: true });
for (const size of [16, 32, 80]) {
  const png = encodePng(size);
  const file = resolve(outDir, `icon-${size}.png`);
  await writeFile(file, png);
  console.log(`wrote ${file} (${png.length} bytes)`);
}
