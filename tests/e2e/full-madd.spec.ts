import { expect, test, type Page } from '@playwright/test';
import { units } from '../../src/content/modules/madd/units.ts';
import { mouse, playLesson } from './helpers.ts';

/**
 * T064 / SC-002 — the whole Madd باب plays through: teacher mode opens every lesson on the path, and
 * every lesson and checkpoint runs to the complete screen and is saved. One test per lesson so they
 * run in parallel; 390 px only (the 360 project covers layout elsewhere).
 */

test.skip(({ viewport }) => viewport?.width !== 390, '390 px project only');

const lessons = units.flatMap((u) => u.lessons.map((l) => ({ id: l.id, kind: l.kind ?? 'lesson' })));

const teacher = {
  version: 1,
  lessons: {},
  xp: { total: 0, byDay: {} },
  streak: { count: 0, lastDay: null },
  srs: {},
  mistakes: [],
  settings: { goal: 20, sound: false, teacher: true, theme: 'auto' },
  seenWelcome: true,
};

async function seed(page: Page, hash: string) {
  await page.goto('./');
  await page.evaluate((v) => localStorage.setItem('tuhfa:v1', JSON.stringify(v)), teacher);
  await page.goto(`./${hash}`);
  await page.reload();
}

test('teacher mode: every Madd lesson is open on the path', async ({ page }) => {
  await seed(page, '#/path');
  await expect(page.locator('.node').first()).toBeVisible();
  await expect(page.locator('.node--locked')).toHaveCount(0);
  for (const l of lessons) await expect(page.locator(`a[href="#/lesson/madd/${l.id}"]`)).toHaveCount(1);
});

for (const [n, l] of lessons.entries()) {
  test(`plays ${l.kind} ${l.id} to the end`, async ({ page }) => {
    test.setTimeout(120_000);
    await seed(page, `#/lesson/madd/${l.id}/${n + 1}`);
    await playLesson(page, mouse);
    await expect(page.locator('#done-title')).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          (key) =>
            !!(JSON.parse(localStorage.getItem('tuhfa:v1') ?? '{}') as { lessons?: object }).lessons?.[
              key as never
            ],
          `madd/${l.id}`,
        ),
      )
      .toBe(true);
  });
}
