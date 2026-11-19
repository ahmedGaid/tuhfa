import { expect, test } from '@playwright/test';
import { keyboard, mouse, noOverflow, passWelcome, playLesson } from './helpers.ts';

/**
 * T038 — play Madd lessons end to end at phone size. The test never peeks at answers: wrong picks
 * just come back later (max 2 more times), and step exercises are solved by trying each option.
 * `#/lesson/<module>/<lesson>/<seed>` pins the session so a run is repeatable.
 */

test('play Madd lesson 1 end to end with taps', async ({ page }) => {
  await page.goto('./');
  await passWelcome(page);
  await page.getByRole('link', { name: /^المد الطبيعي/ }).click();
  await expect(page).toHaveURL(/#\/lesson\/madd\/asli-1$/);
  await page.goto('./#/lesson/madd/asli-1/1');
  await expect(page.getByRole('heading', { name: 'المد الطبيعي' })).toBeVisible();
  await noOverflow(page);
  const kinds = await playLesson(page, mouse);
  expect(kinds.size).toBeGreaterThanOrEqual(4);
  await expect(page.locator('.done__stars')).toBeVisible();
  await expect(page.getByText('الدقة')).toBeVisible();
  await expect(page.getByRole('img', { name: 'نقطة' })).toBeVisible();
  await noOverflow(page);
  await page.getByRole('link', { name: 'الدرس اللي بعده' }).click();
  await expect(page).toHaveURL(/#\/lesson\/madd\/asli-2$/);
});

test('keyboard only: the module checkpoint, every exercise kind it holds', async ({ page }) => {
  await page.goto('./#/lesson/madd/review-checkpoint/15');
  const kinds = await playLesson(page, keyboard);
  // all ten kinds except «لوّن الحكم», whose ayat are still waiting for founder verification
  expect(kinds.size).toBeGreaterThanOrEqual(8);
  await expect(page.locator('#done-title')).toBeVisible();
});

test('exit asks first and nothing is lost by staying', async ({ page }) => {
  await page.goto('./#/lesson/madd/asli-3/12');
  await page.getByRole('button', { name: 'خروج من الدرس' }).click();
  const dialog = page.getByRole('dialog', { name: 'عايز تخرج من الدرس؟' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'كمّل الدرس' }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'خروج من الدرس' }).click();
  await page.getByRole('link', { name: 'اخرج' }).click();
  await expect(page).toHaveURL(/#\/path$/);
});

test('unknown lesson shows a way home', async ({ page }) => {
  await page.goto('./#/lesson/madd/nope');
  await expect(page.getByText('الدرس ده مش موجود، أو الباب لسه ما نزلش.')).toBeVisible();
  await page.getByRole('link', { name: 'ارجع للمسار' }).click();
  await expect(page).toHaveURL(/#\/path$/);
});
