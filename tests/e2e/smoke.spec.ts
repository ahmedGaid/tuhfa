import { expect, test } from '@playwright/test';

test('shell renders RTL Arabic with four tabs and no horizontal overflow', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');

  const tabs = page.getByRole('navigation', { name: 'التنقّل الرئيسي' }).getByRole('link');
  await expect(tabs).toHaveCount(4);
  await expect(page.getByRole('link', { name: 'المسار' })).toHaveAttribute('aria-current', 'page');

  await page.getByRole('link', { name: 'المكتبة' }).click();
  await expect(page).toHaveURL(/#\/library$/);
  await expect(page.getByRole('heading', { name: 'المكتبة' })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('unknown route shows a way home', async ({ page }) => {
  await page.goto('./#/nowhere');
  await expect(page.getByText('الصفحة دي مش موجودة.')).toBeVisible();
  await page.getByRole('link', { name: 'ارجع للمسار' }).click();
  await expect(page).toHaveURL(/#\/path$/);
});
