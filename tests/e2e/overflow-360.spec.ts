import { expect, test, type Page } from '@playwright/test';

/**
 * T062 — no horizontal page scroll at 360 px on any screen (wide things like the tree scroll inside
 * their own box). Runs once, in the 360 project.
 */

test.skip(({ viewport }) => viewport?.width !== 360, '360 px project only');

const state = {
  version: 1,
  lessons: { 'madd/asli-1': { stars: 3, best: 1, done: '2026-11-18' } },
  xp: { total: 70, byDay: { '2026-11-18': 70 } },
  streak: { count: 1, lastDay: '2026-11-18' },
  srs: { 'madd/tab': { box: 1, due: '2026-11-18', wrong: 1 } },
  mistakes: ['madd/tab'],
  settings: { goal: 20, sound: false, teacher: true, theme: 'auto' },
  seenWelcome: true,
};

async function open(page: Page, hash: string) {
  await page.goto(`./${hash}`);
  await page.reload();
  await expect(page.locator('#app > *').first()).toBeVisible();
  // let lazy chunks (module data) render
  await page.waitForLoadState('networkidle');
}

async function width(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test('welcome (first visit)', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'يلا نبدأ' })).toBeVisible();
  expect(await width(page)).toBeLessThanOrEqual(0);
});

test('every tab, library lesson, practice, lesson and about screen', async ({ page }) => {
  await page.goto('./');
  await page.evaluate((v) => localStorage.setItem('tuhfa:v1', JSON.stringify(v)), state);

  const screens = [
    '#/path',
    '#/review',
    '#/practice/mistakes',
    '#/practice/due',
    '#/library',
    '#/me',
    '#/about',
    '#/lesson/madd/asli-1/1',
    '#/lesson/madd/review-checkpoint/15',
    '#/lesson/madd/nope',
  ];
  await open(page, '#/library');
  const libLessons = await page.locator('.lib__item').count();
  expect(libLessons).toBeGreaterThan(0);
  for (let n = 1; n <= libLessons; n++) screens.push(`#/library/madd/${n}`);

  const wide: string[] = [];
  for (const hash of screens) {
    await open(page, hash);
    if ((await width(page)) > 0) wide.push(hash);
  }
  expect(wide).toEqual([]);
});
