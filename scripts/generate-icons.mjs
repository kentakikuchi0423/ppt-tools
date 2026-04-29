// Generates placeholder PNG icons for the manifest at public/assets/.
//
// One "main" icon (used as the add-in's general icon) plus per-operation
// icons used by individual ribbon buttons:
//   icon-{16,32,80}.png                  — main brand icon
//   icon-pack-{down,up,left,right}-...   — pack operations
//   icon-align-{heights,widths}-...      — align operations
//   icon-swap-...                        — swap-positions
//
// Each icon is a solid-colored square with a centered monochrome glyph
// rasterized from a 16x16 pattern. PNG output is hand-rolled (deflate +
// CRC) so we don't pull in a runtime dependency just for icons. Run via
// `npm run icons`.

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync, crc32 } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '..', 'public', 'assets');

const PACK_BG = [0x21, 0x6c, 0xc4]; // blue
const ALIGN_BG = [0x10, 0x89, 0x3e]; // green
const SWAP_BG = [0xca, 0x50, 0x10]; // orange
const FG = [0xff, 0xff, 0xff];

// 16x16 glyph patterns. '#' = foreground, '.' = background.
// Each row must be exactly 16 chars; arrays must have exactly 16 rows.
const GLYPHS = {
  main: [
    '................',
    '................',
    '....######......',
    '....##...##.....',
    '....##...##.....',
    '....##...##.....',
    '....######......',
    '....##..........',
    '....##..........',
    '....##..........',
    '....##..........',
    '....##..........',
    '................',
    '................',
    '................',
    '................',
  ],
  // pack-down: shapes at top, arrow, bar at bottom (pile collapses to bottom).
  'pack-down': [
    '................',
    '..####....####..',
    '..####....####..',
    '..####....####..',
    '..####....####..',
    '................',
    '......####......',
    '......####......',
    '......####......',
    '....########....',
    '.....######.....',
    '......####......',
    '.......##.......',
    '................',
    '################',
    '################',
  ],
  // pack-up: bar at top, arrow, shapes at bottom (pile collapses to top).
  'pack-up': [
    '################',
    '################',
    '................',
    '.......##.......',
    '......####......',
    '.....######.....',
    '....########....',
    '......####......',
    '......####......',
    '......####......',
    '................',
    '..####....####..',
    '..####....####..',
    '..####....####..',
    '..####....####..',
    '................',
  ],
  // pack-left: bar at left, arrow, shapes on right.
  'pack-left': [
    '##..............',
    '##..............',
    '##....##..####..',
    '##...###..####..',
    '##..####..####..',
    '##.#####..####..',
    '##.######.####..',
    '##.######.####..',
    '##.######.####..',
    '##.######.####..',
    '##.#####..####..',
    '##..####..####..',
    '##...###..####..',
    '##....##..####..',
    '##..............',
    '##..............',
  ],
  // pack-right: shapes on left, arrow, bar at right.
  'pack-right': [
    '..............##',
    '..............##',
    '..####..##....##',
    '..####..###...##',
    '..####..####..##',
    '..####..#####.##',
    '..####.######.##',
    '..####.######.##',
    '..####.######.##',
    '..####.######.##',
    '..####..#####.##',
    '..####..####..##',
    '..####..###...##',
    '..####..##....##',
    '..............##',
    '..............##',
  ],
  // align-heights: top and bottom bars with equal-height shapes between.
  'align-heights': [
    '################',
    '................',
    '................',
    '..####....####..',
    '..####....####..',
    '..####....####..',
    '..####....####..',
    '..####....####..',
    '..####....####..',
    '..####....####..',
    '..####....####..',
    '..####....####..',
    '................',
    '................',
    '################',
    '................',
  ],
  // align-widths: left and right bars with equal-width shapes between.
  'align-widths': [
    '#..............#',
    '#..............#',
    '#.############.#',
    '#.############.#',
    '#.############.#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#.############.#',
    '#.############.#',
    '#.############.#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
  ],
  // swap: two arrows pointing in opposite horizontal directions.
  swap: [
    '................',
    '................',
    '..............##',
    '.............###',
    '##############..',
    '.............###',
    '..............##',
    '................',
    '................',
    '##..............',
    '###.............',
    '..##############',
    '###.............',
    '##..............',
    '................',
    '................',
  ],
};

// Sanity-check glyph dimensions at module load so a typo crashes fast.
for (const [name, glyph] of Object.entries(GLYPHS)) {
  if (glyph.length !== 16) {
    throw new Error(`Glyph ${name} has ${glyph.length} rows, expected 16.`);
  }
  for (const [i, row] of glyph.entries()) {
    if (row.length !== 16) {
      throw new Error(`Glyph ${name} row ${i} has ${row.length} cols, expected 16.`);
    }
  }
}

const VARIANTS = [
  { name: 'icon', glyph: 'main', bg: PACK_BG },
  { name: 'icon-pack-down', glyph: 'pack-down', bg: PACK_BG },
  { name: 'icon-pack-up', glyph: 'pack-up', bg: PACK_BG },
  { name: 'icon-pack-left', glyph: 'pack-left', bg: PACK_BG },
  { name: 'icon-pack-right', glyph: 'pack-right', bg: PACK_BG },
  { name: 'icon-align-heights', glyph: 'align-heights', bg: ALIGN_BG },
  { name: 'icon-align-widths', glyph: 'align-widths', bg: ALIGN_BG },
  { name: 'icon-swap', glyph: 'swap', bg: SWAP_BG },
];

const SIZES = [16, 32, 80];

function buildPixels(size, glyphRows, bg) {
  const pixels = Buffer.alloc(size * size * 3);
  // Center the 16x16 glyph; scale up for larger icons (16->1, 32->2, 80->5).
  const scale = Math.max(1, Math.floor(size / 16));
  const glyphSide = 16 * scale;
  const offset = Math.floor((size - glyphSide) / 2);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = Math.floor((x - offset) / scale);
      const gy = Math.floor((y - offset) / scale);
      const inGlyph =
        gx >= 0 && gx < 16 && gy >= 0 && gy < 16 && glyphRows[gy] && glyphRows[gy][gx] === '#';
      const [r, g, b] = inGlyph ? FG : bg;
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

function encodePng(size, glyphRows, bg) {
  const pixels = buildPixels(size, glyphRows, bg);
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    pixels.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  }
  const compressed = deflateSync(raw);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

await mkdir(outDir, { recursive: true });
for (const variant of VARIANTS) {
  const glyph = GLYPHS[variant.glyph];
  for (const size of SIZES) {
    const png = encodePng(size, glyph, variant.bg);
    const file = resolve(outDir, `${variant.name}-${size}.png`);
    await writeFile(file, png);
    console.log(`wrote ${file} (${png.length} bytes)`);
  }
}
