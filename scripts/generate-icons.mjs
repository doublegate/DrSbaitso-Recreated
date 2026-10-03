/**
 * Renders the PWA icons and favicon from SVG with the bundled IBM VGA font.
 *
 *   node scripts/generate-icons.mjs
 *
 * Writes public/icons/icon-<size>.png ("any"), icon-maskable-<size>.png (art
 * inside the 80% safe zone), icon-base.svg, and public/favicon.ico (PNG-in-ICO).
 * Uses Playwright's Chromium, a dev dependency already installed for e2e.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const font = readFileSync(path.join(root, 'public/fonts/Web437_IBM_VGA_9x16.woff')).toString('base64');

// The original's palette (ref-docs/03): DOS blue, bright white, bright yellow.
const BLUE = '#0000AA';
const WHITE = '#FFFFFF';
const YELLOW = '#FFFF55';
const FONT = 'font-family="\'IBM VGA 9x16\'"';

/** The title block: SOUND BLASTER / DR / SBAITSO, then a prompt with a cursor. */
const content = `
  <text x="256" y="138" text-anchor="middle" ${FONT} font-size="34" fill="${WHITE}">SOUND BLASTER</text>
  <text x="256" y="262" text-anchor="middle" ${FONT} font-size="124" fill="${YELLOW}">DR</text>
  <text x="256" y="350" text-anchor="middle" ${FONT} font-size="78" fill="${YELLOW}">SBAITSO</text>
  <text x="150" y="420" ${FONT} font-size="48" fill="${YELLOW}">&gt;</text>
  <rect x="180" y="410" width="27" height="6" fill="${WHITE}"/>`;

/** "any": full art with the double-line banner frame. */
const anySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BLUE}"/>
  <rect x="36" y="36" width="440" height="440" fill="none" stroke="${WHITE}" stroke-width="6"/>
  <rect x="52" y="52" width="408" height="408" fill="none" stroke="${WHITE}" stroke-width="6"/>
  ${content}
</svg>`;

/** Maskable: full-bleed background, no frame, art scaled into the safe zone. */
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BLUE}"/>
  <g transform="translate(256 256) scale(0.8) translate(-256 -270)">${content}</g>
</svg>`;

/** Favicon sizes: one readable glyph. */
const smallSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BLUE}"/>
  <rect x="24" y="24" width="464" height="464" fill="none" stroke="${WHITE}" stroke-width="32"/>
  <text x="256" y="400" text-anchor="middle" ${FONT} font-size="400" fill="${YELLOW}">S</text>
</svg>`;

const page = (svg, size) => `<!doctype html><html><head><style>
  @font-face { font-family: 'IBM VGA 9x16'; src: url(data:font/woff;base64,${font}) format('woff'); }
  html, body { margin: 0; background: ${BLUE}; }
  svg { display: block; width: ${size}px; height: ${size}px; }
</style></head><body>${svg}</body></html>`;

const browser = await chromium.launch();
const tab = await browser.newPage();

async function render(svg, size) {
  await tab.setViewportSize({ width: size, height: size });
  await tab.setContent(page(svg, size));
  await tab.evaluate(() => document.fonts.ready);
  return tab.screenshot({ clip: { x: 0, y: 0, width: size, height: size } });
}

const out = (file) => path.join(root, 'public', file);
for (const size of [72, 96, 128, 144, 152, 192, 384, 512]) {
  writeFileSync(out(`icons/icon-${size}x${size}.png`), await render(anySvg, size));
}
for (const size of [192, 512]) {
  writeFileSync(out(`icons/icon-maskable-${size}x${size}.png`), await render(maskableSvg, size));
}
const small = {};
for (const size of [16, 32, 48]) {
  small[size] = await render(smallSvg, size);
  if (size !== 48) writeFileSync(out(`icons/icon-${size}x${size}.png`), small[size]);
}
await browser.close();
writeFileSync(out('icons/icon-base.svg'), anySvg.replace(/\$\{FONT\}/g, ''));

// favicon.ico holding PNG images (supported by every current browser).
const images = [16, 32, 48].map((size) => ({ size, png: small[size] }));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = 6 + 16 * images.length;
const entries = images.map(({ size, png }) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0);
  entry.writeUInt8(size, 1);
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += png.length;
  return entry;
});
writeFileSync(out('favicon.ico'), Buffer.concat([header, ...entries, ...images.map((i) => i.png)]));
console.log('icons written');
