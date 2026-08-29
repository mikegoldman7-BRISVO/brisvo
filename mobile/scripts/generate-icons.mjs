/**
 * Generates the REAL VOICES app icons.
 *
 * The mark is a waveform of rounded bars in the BrisVO accent on the site's
 * near-black ground — legible down to favicon size, and it needs no font, so
 * the icons can be regenerated anywhere with just Node.
 *
 * Run: node scripts/generate-icons.mjs
 */
import { deflateSync, crc32 } from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), "..", "assets");

const BACKGROUND = [0x0d, 0x0d, 0x0d];
const ACCENT = [0xff, 0x3d, 0x57];
const WHITE = [0xff, 0xff, 0xff];

/** Bar heights as a fraction of the mark's height, centred vertically. */
const BARS = [0.30, 0.58, 0.86, 1.0, 0.72, 0.44, 0.66, 0.24];

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/**
 * @param {number} width
 * @param {number} height
 * @param {boolean} alpha
 * @param {(x: number, y: number) => number[]} sample RGB or RGBA per pixel.
 */
function encodePng(width, height, alpha, sample) {
  const channels = alpha ? 4 : 3;
  const stride = width * channels;
  const raw = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < width; x += 1) {
      const pixel = sample(x, y);
      for (let c = 0; c < channels; c += 1) {
        raw[rowStart + 1 + x * channels + c] = pixel[c];
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = alpha ? 6 : 2; // colour type
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/**
 * Coverage of the waveform mark at (x, y), 0..1, anti-aliased by supersampling.
 * `scale` shrinks the mark within the canvas (Android adaptive icons need the
 * artwork inside a safe centre area).
 */
function markCoverage(x, y, size, scale) {
  const markWidth = size * scale;
  const left = (size - markWidth) / 2;
  const centreY = size / 2;
  const gap = markWidth / (BARS.length * 2 - 1);
  const barWidth = gap;
  const radius = barWidth / 2;

  const SAMPLES = 4;
  let hits = 0;

  for (let sy = 0; sy < SAMPLES; sy += 1) {
    for (let sx = 0; sx < SAMPLES; sx += 1) {
      const px = x + (sx + 0.5) / SAMPLES;
      const py = y + (sy + 0.5) / SAMPLES;

      for (let i = 0; i < BARS.length; i += 1) {
        const barLeft = left + i * (barWidth + gap);
        const barRight = barLeft + barWidth;
        if (px < barLeft || px > barRight) continue;

        const halfHeight = (BARS[i] * markWidth * 0.62) / 2;
        const top = centreY - halfHeight;
        const bottom = centreY + halfHeight;

        // Rounded caps: inside the straight section, or within the end circles.
        const withinStraight = py >= top + radius && py <= bottom - radius;
        const barCentreX = barLeft + radius;
        const nearTopCap = (px - barCentreX) ** 2 + (py - (top + radius)) ** 2 <= radius ** 2;
        const nearBottomCap =
          (px - barCentreX) ** 2 + (py - (bottom - radius)) ** 2 <= radius ** 2;

        if (withinStraight || nearTopCap || nearBottomCap) {
          hits += 1;
          break;
        }
      }
    }
  }

  return hits / (SAMPLES * SAMPLES);
}

function blend(background, foreground, alpha) {
  return background.map((channel, i) => Math.round(channel * (1 - alpha) + foreground[i] * alpha));
}

function writeOpaque(name, size, scale) {
  const png = encodePng(size, size, false, (x, y) =>
    blend(BACKGROUND, ACCENT, markCoverage(x, y, size, scale)),
  );
  writeFileSync(join(ASSETS, name), png);
  return `${name} (${size}×${size}, opaque)`;
}

function writeTransparent(name, size, scale, colour) {
  const png = encodePng(size, size, true, (x, y) => {
    const coverage = markCoverage(x, y, size, scale);
    return [...colour, Math.round(coverage * 255)];
  });
  writeFileSync(join(ASSETS, name), png);
  return `${name} (${size}×${size}, alpha)`;
}

const written = [
  // App Store artwork must be opaque — no alpha channel.
  writeOpaque("icon.png", 1024, 0.74),
  writeOpaque("favicon.png", 64, 0.7),
  writeTransparent("splash-icon.png", 512, 0.8, ACCENT),
  // Adaptive icon artwork sits inside a 66% safe circle.
  writeTransparent("android-icon-foreground.png", 1024, 0.42, ACCENT),
  writeTransparent("android-icon-monochrome.png", 1024, 0.42, WHITE),
];

writeFileSync(
  join(ASSETS, "android-icon-background.png"),
  encodePng(1024, 1024, false, () => BACKGROUND),
);

console.log(["Wrote:", ...written, "android-icon-background.png (1024×1024, opaque)"].join("\n  "));
