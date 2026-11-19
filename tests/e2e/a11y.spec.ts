import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { mouse, playLesson } from './helpers.ts';

/**
 * T065 — axe on every screen, light and dark, plus the states a learner meets inside a lesson
 * (teach card, an exercise, the feedback sheet, the complete screen) and the book-page viewer.
 * 390 px only.
 */

test.skip(({ viewport }) => viewport?.width !== 390, '390 px project only');

const state = (theme: 'light' | 'dark') => ({
  version: 1,
  lessons: { 'madd/asli-1': { stars: 3, best: 1, done: '2026-11-18' } },
  xp: { total: 70, byDay: { '2026-11-18': 70 } },
  streak: { count: 1, lastDay: '2026-11-18' },
  srs: { 'madd/tab': { box: 1, due: '2026-11-18', wrong: 1 } },
  mistakes: ['madd/tab'],
  settings: { goal: 20, sound: false, teacher: false, theme },
  seenWelcome: true,
});

async function axe(page: Page, where: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  return violations.map(
    (v) =>
      `${where} · ${v.id} (${v.impact}): ${v.help} → ${v.nodes
        .slice(0, 3)
        .map((n) => `${n.target.join(' ')} [${n.any[0]?.message ?? ''}]`)
        .join(' | ')}`,
  );
}

async function open(page: Page, hash: string) {
  await page.goto(`./${hash}`);
  await page.reload();
  await page.waitForLoadState('networkidle');
}

for (const theme of ['light', 'dark'] as const) {
  test(`${theme}: every screen has no axe violations`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ colorScheme: theme });
    const found: string[] = [];

    await page.goto('./');
    found.push(...(await axe(page, 'welcome')));
    await page.evaluate((v) => localStorage.setItem('tuhfa:v1', JSON.stringify(v)), state(theme));

    for (const hash of [
      '#/path',
      '#/review',
      '#/library',
      '#/library/madd/1',
      '#/library/madd/7',
      '#/me',
      '#/about',
    ]) {
      await open(page, hash);
      found.push(...(await axe(page, hash)));
    }

    // book page viewer
    await open(page, '#/library/madd/7');
    await page.getByRole('button', { name: /شوف الصفحة من الكتاب/ }).click();
    await page.getByRole('button', { name: 'صفحة ١ من الكتاب' }).click();
    found.push(...(await axe(page, 'book viewer')));

    // a lesson: teach card → exercise → feedback sheet
    await open(page, '#/lesson/madd/asli-2/3');
    found.push(...(await axe(page, 'lesson start')));
    const gotIt = page.getByRole('button', { name: 'فهمت، يلا نتمرّن' });
    if (await gotIt.isVisible()) await gotIt.click();
    await expect(page.locator('section.ex')).toBeVisible();
    found.push(...(await axe(page, 'exercise')));
    const opt = page.locator('section.ex .opt').first();
    if (await opt.isVisible()) {
      await opt.click();
      await expect(page.locator('.sheet')).toBeVisible();
      found.push(...(await axe(page, 'feedback sheet')));
    }
    await playLesson(page, mouse);
    found.push(...(await axe(page, 'lesson complete')));

    expect(found).toEqual([]);
  });
}
