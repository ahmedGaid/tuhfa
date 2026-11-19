import { expect, test, type Page } from '@playwright/test';
import { mouse, noOverflow, passWelcome, playLesson } from './helpers.ts';

/** M5 — review (US4), library (US5), export / import + about (US6). */

const today = new Date('2026-11-19T10:00:00');

function state(over: Record<string, unknown> = {}) {
  return {
    version: 1,
    lessons: { 'madd/asli-1': { stars: 3, best: 1, done: '2026-11-18' } },
    xp: { total: 70, byDay: { '2026-11-18': 70 } },
    streak: { count: 1, lastDay: '2026-11-18' },
    srs: {
      'madd/tab': { box: 2, due: '2026-11-19', wrong: 0 },
      'madd/harf': { box: 1, due: '2026-11-19', wrong: 1 },
      'madd/tamk': { box: 3, due: '2026-11-30', wrong: 0 },
    },
    mistakes: ['madd/harf'],
    settings: { goal: 20, sound: false, teacher: false, theme: 'auto' },
    seenWelcome: true,
    ...over,
  };
}

/** Write a saved state, then open `hash` with a real reload (a hash-only goto keeps the old app state). */
async function seed(page: Page, s: unknown, hash: string) {
  await page.goto('./');
  await page.evaluate((v) => localStorage.setItem('tuhfa:v1', JSON.stringify(v)), s);
  await page.goto(`./${hash}`);
  await page.reload();
}

const stored = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('tuhfa:v1') ?? 'null') as ReturnType<typeof state>);

test.describe('review', () => {
  test('nothing to review → friendly empty state with a way back to the path', async ({ page }) => {
    await page.goto('./');
    await passWelcome(page);
    await page.getByRole('link', { name: 'راجع' }).click();
    await expect(page.getByRole('heading', { name: 'مفيش حاجة عليها الدور دلوقتي' })).toBeVisible();
    await page.getByRole('link', { name: 'كمّل في المسار' }).click();
    await expect(page).toHaveURL(/#\/path$/);
  });

  test('mistakes and due concepts are offered; a review session updates the boxes', async ({ page }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.setFixedTime(today);
    await seed(page, state(), '#/review');
    await expect(page.getByText('أحكام غلطت فيها قبل كده: ١')).toBeVisible();
    // tab and harf are due today, tamk later
    await expect(page.getByText('أحكام عليها الدور النهارده: ٢')).toBeVisible();
    await noOverflow(page);

    await page.getByRole('link', { name: 'يلا نراجع' }).first().click();
    await expect(page).toHaveURL(/#\/practice\/mistakes$/);
    await playLesson(page, mouse);
    await expect(page.getByText(/خلّصت «راجع غلطاتي»/)).toBeVisible();

    // the save is debounced: wait until the review result is on disk
    await expect.poll(async () => (await stored(page)).xp.total).toBeGreaterThan(70);
    const s = await stored(page);
    // harf was practised: up a box (due later) or back to box 1 (due tomorrow) — never still due today
    expect(s.srs['madd/harf']!.due > '2026-11-19').toBe(true);
    expect(s.lessons).toEqual(state().lessons);

    await page.getByRole('link', { name: 'ارجع لراجع' }).click();
    await expect(page).toHaveURL(/#\/review$/);
  });
});

test.describe('library', () => {
  test('lessons list, ruler + table badges, channel opens outside', async ({ page }) => {
    await seed(page, state(), '#/library');
    await expect(page.getByRole('heading', { name: 'المكتبة', level: 1 })).toBeVisible();
    await expect(page.locator('.lib__item')).toHaveCount(21);
    await expect(page.locator('.ruler .tariq--sh').first()).toHaveText('الشاطبية');
    await expect(page.locator('.ruler .tariq--tb').first()).toHaveText('الطيبة');
    const channel = page.getByRole('link', { name: /انضم للقناة/ });
    await expect(channel).toHaveAttribute('href', /^https:\/\/t\.me\/\+/);
    await expect(channel).toHaveAttribute('target', '_blank');
    await noOverflow(page);
  });

  test('lesson 7: book page opens, zooms, closes with Esc', async ({ page }) => {
    await seed(page, state(), '#/library');
    await page.locator('.lib__item').nth(6).click();
    await expect(page).toHaveURL(/#\/library\/madd\/7$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('مد الصلة الصغرى');
    await page.getByRole('button', { name: /شوف الصفحة من الكتاب/ }).click();
    await page.getByRole('button', { name: 'صفحة ١ من الكتاب' }).click();
    const viewer = page.getByRole('dialog', { name: 'صفحة من الكتاب' });
    await expect(viewer).toBeVisible();
    const img = viewer.locator('img');
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.naturalWidth)).toBeGreaterThan(0);
    await viewer.getByRole('button', { name: 'تكبير / تصغير' }).click();
    await expect(viewer).toHaveClass(/lb--zoom/);
    await page.keyboard.press('Escape');
    await expect(viewer).toBeHidden();
    await noOverflow(page);
  });

  test('the tree scrolls sideways inside its own box, never the page', async ({ page }) => {
    await seed(page, state(), '#/library/madd/1');
    const box = page.locator('.tree__scroll');
    await expect(box).toBeVisible();
    await page.getByRole('button', { name: 'كبّر' }).click();
    await page.getByRole('button', { name: 'كبّر' }).click();
    await page.getByRole('button', { name: 'كبّر' }).click();
    await expect.poll(() => box.evaluate((e) => e.scrollWidth - e.clientWidth)).toBeGreaterThan(0);
    await noOverflow(page);
  });
});

test.describe('profile + about', () => {
  test('export code → wipe → bad code changes nothing → good code restores', async ({ page }) => {
    await seed(page, state(), '#/me');
    await page.getByRole('button', { name: 'اعرض كود التقدّم' }).click();
    const code = await page.getByRole('textbox', { name: 'اعرض كود التقدّم' }).inputValue();
    expect(code).toMatch(/^TUHFA1\./);
    await noOverflow(page);

    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await passWelcome(page);
    await page.getByRole('link', { name: 'حسابي' }).click();
    const box = page.getByRole('textbox', { name: 'استرجع تقدّمك' });

    await box.fill(code.slice(0, -3) + 'zzz');
    await page.getByRole('button', { name: 'استرجع', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('الكود ناقص');
    await expect(page.locator('.me__facts dd').first()).toContainText('٠');

    await box.fill(code);
    await page.getByRole('button', { name: 'استرجع', exact: true }).click();
    await page.getByRole('button', { name: 'أيوه، استرجع' }).click();
    await expect(page.locator('.me__facts dd').first()).toContainText('٧٠');
    await page.reload();
    await expect(page.locator('.me__facts dd').first()).toContainText('٧٠');
    const s = await stored(page);
    expect(s.srs).toEqual(state().srs);
    expect(s.mistakes).toEqual(state().mistakes);
  });

  test('about shows the Sheikh credit and the Tanzil source', async ({ page }) => {
    await seed(page, state(), '#/me');
    await page.getByRole('link', { name: 'عن تحفة' }).click();
    await expect(page).toHaveURL(/#\/about$/);
    await expect(page.locator('.about__credit')).toHaveText(
      'المحتوى مأخوذ من دروس فضيلة الشيخ جابر في شرح متن تحفة الأطفال، جزاه الله خيرًا',
    );
    await expect(page.getByRole('link', { name: 'tanzil.net' })).toHaveAttribute(
      'href',
      'https://tanzil.net',
    );
    await expect(page.getByRole('link', { name: 'حسابي', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await noOverflow(page);
  });
});
