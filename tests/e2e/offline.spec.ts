import { expect, test } from '@playwright/test';
import { passWelcome, playLesson, mouse } from './helpers.ts';

/**
 * T059 / US6 — installable, and after one online visit the whole app works offline: app shell,
 * lesson data, fonts and book pages (FR-016, research R8).
 */

test('manifest is Arabic, RTL, standalone, with icons that load', async ({ page, request }) => {
  await page.goto('./');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const res = await request.get(new URL(href!, page.url()).href);
  expect(res.ok()).toBe(true);
  const m = (await res.json()) as {
    short_name: string;
    lang: string;
    dir: string;
    display: string;
    icons: { src: string; sizes: string; purpose?: string }[];
  };
  expect(m.short_name).toBe('تحفة');
  expect([m.lang, m.dir, m.display]).toEqual(['ar', 'rtl', 'standalone']);
  expect(m.icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(m.icons.some((i) => i.purpose === 'maskable')).toBe(true);
  for (const i of m.icons) expect((await request.get(new URL(i.src, res.url()).href)).ok()).toBe(true);
});

test('one visit, then offline: reload, play a lesson, fonts and book pages still there', async ({
  page,
  context,
}) => {
  await page.goto('./');
  // wait until the service worker has installed (= everything precached) and controls the page
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await passWelcome(page);
  await expect(page.getByRole('link', { name: /^المد الطبيعي/ })).toBeVisible();

  // lesson data (a lazy chunk) comes from the cache too
  await page.goto('./#/lesson/madd/asli-1/1');
  await playLesson(page, mouse);
  await expect(page.locator('#done-title')).toBeVisible();

  const offline = await page.evaluate(async () => {
    const quran = await document.fonts.load('700 24px "Scheherazade New"', 'بِسْمِ');
    const ui = await document.fonts.load('600 16px "Cairo"', 'تحفة');
    const book = await fetch('book/a-1.jpg');
    return { quran: quran.length, ui: ui.length, book: book.ok, type: book.headers.get('content-type') };
  });
  expect(offline).toEqual({ quran: 1, ui: 1, book: true, type: 'image/jpeg' });
});
