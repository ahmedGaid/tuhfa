/**
 * Renders the app icons (T059) from «نقطة» — the same ink dot as `public/favicon.svg` and the
 * `Mascot` idle pose, without the face so it reads at 48 px. Writes PNGs into `public/icons/`.
 * Run once after changing the drawing: `node scripts/make-icons.ts`. Output is committed.
 */
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const BG = '#f5f5f3'; // --bg (light), tuhfa-brand neutrals
const INK = '#26282e'; // --ink (light)
const DOT = 'M32 12c10 0 19 9 19 20 0 12-9 20-19 20S13 44 13 32c0-7 4-13 9-16 3-2 6-4 10-4z';

/** `pad` = share of the canvas the dot's 64-unit box may use (maskable icons need ≤ 0.8 safe zone). */
function svg(size: number, scale: number, rounded: boolean): string {
  const r = rounded ? size * 0.22 : 0;
  const s = (size * scale) / 64;
  const off = (size - 64 * s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<rect width="${size}" height="${size}" rx="${r}" fill="${BG}"/>
<g transform="translate(${off} ${off}) scale(${s})"><path d="${DOT}" fill="${INK}" transform="rotate(-18 32 32)"/></g>
</svg>`;
}

const icons = [
  { file: 'icon-192.png', size: 192, scale: 1, rounded: true },
  { file: 'icon-512.png', size: 512, scale: 1, rounded: true },
  { file: 'maskable-512.png', size: 512, scale: 0.75, rounded: false },
  { file: 'apple-touch-icon.png', size: 180, scale: 0.9, rounded: false },
];

mkdirSync('public/icons', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const i of icons) {
  await page.setViewportSize({ width: i.size, height: i.size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${svg(i.size, i.scale, i.rounded)}</body></html>`,
  );
  await page.locator('svg').screenshot({ path: `public/icons/${i.file}`, omitBackground: true });
  console.log(`public/icons/${i.file}`);
}
await browser.close();
