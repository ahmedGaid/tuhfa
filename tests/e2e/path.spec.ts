import { expect, test, type Page } from '@playwright/test';
import { mouse, noOverflow, passWelcome, playLesson } from './helpers.ts';

/**
 * T047 — the path with persistent progress: finish two lessons on day 1, reload, stars + unlock
 * survive; finish one more on day 2 (fixed fake clock) → streak 2.
 */

const day1 = new Date('2026-11-18T10:00:00');
const day2 = new Date('2026-11-19T10:00:00');

const node = (page: Page, title: string) =>
  page.locator('.node', { has: page.locator('.node__title').getByText(title, { exact: true }) });

async function finish(page: Page, lesson: string, seed: number) {
  await page.goto(`./#/lesson/madd/${lesson}/${seed}`);
  await playLesson(page, mouse);
  await page.getByRole('link', { name: 'ارجع للمسار' }).click();
  await expect(page).toHaveURL(/#\/path$/);
}

test('two lessons, reload, stars and unlock persist; next day streak = 2', async ({ page }) => {
  test.setTimeout(180_000);
  // a frozen clock also freezes CSS animations, which Playwright then sees as "never stable"
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.setFixedTime(day1);
  await page.goto('./');
  await passWelcome(page);

  // fresh: Madd open, first lesson current, the next one locked; «قريبًا» chapters don't block
  await expect(page.getByRole('heading', { name: 'أحكام المد والقصر' })).toBeVisible();
  await expect(page.getByText('قريبًا').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /^المد الطبيعي الدرس اللي عليه الدور/ })).toBeVisible();
  await expect(node(page, 'المد الطبيعي الحرفي')).toHaveClass(/node--locked/);
  await expect(page.getByRole('img', { name: 'أيام متتالية: ٠' })).toBeVisible();
  await noOverflow(page);

  await finish(page, 'asli-1', 1);
  await finish(page, 'asli-2', 2);

  await page.reload();
  await expect(node(page, 'المد الطبيعي')).toHaveClass(/node--done/);
  await expect(node(page, 'المد الطبيعي').getByRole('img', { name: /من ٣ نجوم/ })).toBeVisible();
  await expect(node(page, 'المد الطبيعي الحرفي')).toHaveClass(/node--done/);
  await expect(node(page, 'مد التمكين')).toHaveClass(/node--current/);
  await expect(node(page, 'مد العوض')).toHaveClass(/node--locked/);
  await expect(page.getByRole('img', { name: 'أيام متتالية: ١' })).toBeVisible();
  // daily goal 20 is already met by one lesson
  await expect(page.getByRole('img', { name: /^هدف النهارده: \S+ من ٢٠ نقطة$/ })).toBeVisible();

  await page.clock.setFixedTime(day2);
  await page.reload();
  await expect(page.getByRole('img', { name: 'أيام متتالية: ١' })).toBeVisible();
  await finish(page, 'asli-3', 3);
  await expect(page.getByRole('img', { name: 'أيام متتالية: ٢' })).toBeVisible();
});

test('teacher mode opens every lesson; settings persist', async ({ page }) => {
  await page.goto('./');
  await passWelcome(page);
  await expect(node(page, 'مد العوض')).toHaveClass(/node--locked/);

  await page.getByRole('link', { name: 'حسابي' }).click();
  await page.getByRole('switch', { name: /وضع المدرّس/ }).check();
  await page.getByRole('radio', { name: /متوسط/ }).check();
  await noOverflow(page);
  await page.reload();
  await expect(page.getByRole('switch', { name: /وضع المدرّس/ })).toBeChecked();
  await expect(page.getByRole('radio', { name: /متوسط/ })).toBeChecked();

  await page.getByRole('link', { name: 'المسار' }).click();
  await expect(page.getByRole('link', { name: /^مد العوض/ })).toBeVisible();
  await expect(page.locator('.node[aria-disabled]')).toHaveCount(0);
});
