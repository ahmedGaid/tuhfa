/**
 * Screenshots of every screen at 390×844 (light + dark) into docs/screens/v1/ (T069).
 * Needs a running preview: `npm run build && npx vite preview --port 4181`, then
 * `node scripts/screens.ts [baseUrl]` (default http://localhost:4181/tuhfa/).
 */
import { mkdirSync } from 'node:fs';
import { chromium, type Page } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:4181/tuhfa/';
const out = 'docs/screens/v1';

const state = {
  version: 1,
  lessons: {
    'madd/asli-1': { stars: 3, best: 1, done: '2026-11-18' },
    'madd/asli-2': { stars: 2, best: 0.8, done: '2026-11-19' },
  },
  xp: { total: 130, byDay: { '2026-11-18': 70, '2026-11-19': 60 } },
  streak: { count: 2, lastDay: '2026-11-19' },
  srs: { 'madd/tab': { box: 1, due: '2026-11-18', wrong: 1 } },
  mistakes: ['madd/tab'],
  settings: { goal: 20, sound: false, teacher: false, theme: 'auto' },
  seenWelcome: true,
};

async function shot(page: Page, name: string) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400); // settle the 150–220 ms transitions
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(`${out}/${name}.png`);
}

async function open(page: Page, hash: string) {
  await page.goto(base + hash);
  await page.reload();
}

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const theme of ['light', 'dark'] as const) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    colorScheme: theme,
    locale: 'ar-EG',
    serviceWorkers: 'block',
  });
  const page = await ctx.newPage();
  await page.goto(base);
  await shot(page, `${theme}-01-welcome`);
  await page.evaluate((v) => localStorage.setItem('tuhfa:v1', JSON.stringify(v)), state);
  const screens: [string, string][] = [
    ['#/path', '02-path'],
    ['#/review', '03-review'],
    ['#/library', '04-library'],
    ['#/library/madd/1', '05-library-lesson'],
    ['#/me', '06-profile'],
    ['#/about', '07-about'],
  ];
  for (const [hash, name] of screens) {
    await open(page, hash);
    await shot(page, `${theme}-${name}`);
  }
  await open(page, '#/library/madd/7');
  await page.getByRole('button', { name: /شوف الصفحة من الكتاب/ }).click();
  await page.getByRole('button', { name: 'صفحة ١ من الكتاب' }).click();
  await shot(page, `${theme}-08-book-page`);

  await open(page, '#/lesson/madd/asli-3/4');
  await shot(page, `${theme}-09-teach-card`);
  await page.getByRole('button', { name: 'فهمت، يلا نتمرّن' }).click();
  await shot(page, `${theme}-10-exercise`);
  const opt = page.locator('section.ex .opt').first();
  if (await opt.isVisible()) {
    await opt.click();
    await shot(page, `${theme}-11-feedback`);
  }
  await ctx.close();
}
await browser.close();
