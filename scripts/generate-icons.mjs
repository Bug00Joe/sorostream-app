/**
 * PWA icon generator — no external dependencies.
 *
 * Produces proper 192×192 and 512×512 PNGs using a pure-JS PNG encoder.
 * Each icon is a dark rounded-square (#111827) with the green (#4ade80)
 * SoroStream "S" letterform.
 *
 * Run with: node scripts/generate-icons.mjs
 */
import { writeFileSync, mkdirSync } from "fs";
import { deflateSync } from "zlib";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "icons");
mkdirSync(OUT, { recursive: true });

// ─── Minimal PNG encoder ────────────────────────────────────────────────────

function crc32(buf) {
  const table = crc32.table ?? (crc32.table = buildCrcTable());
  let c = 0xffffffff;
  for (const b of buf) c = (c >>> 8) ^ table[(c ^ b) & 0xff];
  return (c ^ 0xffffffff) >>> 0;
}
function buildCrcTable() {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBytes, data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, pixels /* Uint8Array RGBA */) {
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour (RGB — we'll strip alpha below)
  // Use RGBA colour type (6) instead
  ihdr[9] = 6;

  // Build raw scanlines: each row is prefixed with a filter byte (0 = None)
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = y * (1 + width * 4) + 1 + x * 4;
      raw[dst] = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
      raw[dst + 3] = pixels[src + 3];
    }
  }

  const compressed = deflateSync(raw, { level: 6 });

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ─── Draw icon ──────────────────────────────────────────────────────────────

const BG   = [0x11, 0x18, 0x27, 0xff]; // #111827
const RING = [0x16, 0xa3, 0x4a, 0xff]; // #16a34a (dark green ring)
const TEXT = [0x4a, 0xde, 0x80, 0xff]; // #4ade80 (bright green "S")

function lerp(a, b, t) { return a + (b - a) * t; }

/**
 * Returns true if (px, py) is inside a rounded rectangle.
 * r = corner radius.
 */
function inRoundRect(px, py, w, h, r) {
  const x = Math.min(Math.max(px, r), w - r);
  const y = Math.min(Math.max(py, r), h - r);
  return (px - x) ** 2 + (py - y) ** 2 <= r * r;
}

/**
 * Signed distance to a circle edge — negative inside, positive outside.
 */
function sdfCircleEdge(px, py, cx, cy, radius, thickness) {
  const d = Math.hypot(px - cx, py - cy);
  return Math.abs(d - radius) - thickness / 2;
}

function makeIconPixels(size) {
  const pixels = new Uint8Array(size * size * 4);
  const cx = size / 2, cy = size / 2;
  const r = size * 0.417;      // outer ring radius (≈80/192)
  const ringW = size * 0.034;  // ring stroke width

  // Very rough "S" shape via a bitmask sampled from a reference grid.
  // We rasterise a bold "S" using a simplified approach: draw 5 horizontal
  // bars and two curved connectors, all defined relative to icon size.
  const u = size / 192; // scale unit

  function inSBar(px, py, x0, y0, x1, y1) {
    return px >= x0 && px <= x1 && py >= y0 && py <= y1;
  }

  // The "S" occupies roughly [56,136] × [44,148] in the 192 coordinate space.
  // We draw it as three horizontal rectangles + two curved arcs (approximated
  // as filled rects) and two diagonal connectors.
  function inLetterS(px, py) {
    // Normalise to the 192-unit space
    const x = px / u, y = py / u;

    // Bounding box of S: 56–136 wide, 36–156 tall (centred at 96,96)
    if (x < 56 || x > 136 || y < 36 || y > 156) return false;

    // Top bar
    if (inSBar(x, y, 60, 36, 132, 58)) return true;
    // Middle bar
    if (inSBar(x, y, 60, 86, 132, 106)) return true;
    // Bottom bar
    if (inSBar(x, y, 60, 134, 132, 156)) return true;
    // Top-left vertical stroke
    if (inSBar(x, y, 56, 36, 76, 106)) return true;
    // Bottom-right vertical stroke
    if (inSBar(x, y, 116, 86, 136, 156)) return true;

    return false;
  }

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const idx = (py * size + px) * 4;

      // Anti-aliased rounded background
      const margin = 2;
      const rr = size * 0.208; // corner radius (≈40/192)
      const inBg = inRoundRect(px + 0.5, py + 0.5, size, size, rr);
      if (!inBg) {
        // Transparent outside the rounded rect
        pixels[idx] = pixels[idx+1] = pixels[idx+2] = pixels[idx+3] = 0;
        continue;
      }

      // Default: background colour
      pixels[idx]   = BG[0];
      pixels[idx+1] = BG[1];
      pixels[idx+2] = BG[2];
      pixels[idx+3] = BG[3];

      // Ring (anti-aliased SDF)
      const sdf = sdfCircleEdge(px + 0.5, py + 0.5, cx, cy, r, ringW);
      if (sdf < 1) {
        const alpha = Math.max(0, 1 - sdf);
        pixels[idx]   = Math.round(lerp(BG[0], RING[0], alpha));
        pixels[idx+1] = Math.round(lerp(BG[1], RING[1], alpha));
        pixels[idx+2] = Math.round(lerp(BG[2], RING[2], alpha));
        pixels[idx+3] = 0xff;
      }

      // "S" letterform
      if (inLetterS(px, py)) {
        pixels[idx]   = TEXT[0];
        pixels[idx+1] = TEXT[1];
        pixels[idx+2] = TEXT[2];
        pixels[idx+3] = TEXT[3];
      }
    }
  }

  return pixels;
}

for (const size of [192, 512]) {
  const pixels = makeIconPixels(size);
  const png = encodePng(size, size, pixels);
  const out = join(OUT, `icon-${size}.png`);
  writeFileSync(out, png);
  console.log(`✓ Generated ${out} (${png.length} bytes)`);
}
