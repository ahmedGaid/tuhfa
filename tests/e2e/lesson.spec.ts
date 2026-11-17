import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * T038 — play Madd lessons end to end at phone size. The test never peeks at answers: wrong picks
 * just come back later (max 2 more times), and step exercises are solved by trying each option.
 * `#/lesson/<module>/<lesson>/<seed>` pins the session so a run is repeatable.
 */

type Press = (l: Locator) => Promise<void>;
const mouse: Press = (l) => l.click();
const keyboard: Press = async (l) => {
  await l.focus();
  await l.press('Enter');
};

async function enabled(l: Locator): Promise<Locator[]> {
  const out: Locator[] = [];
  for (const x of await l.all()) if (await x.isEnabled()) out.push(x);
  return out;
}

async function solveStep(page: Page, kind: string, press: Press) {
  const ex = page.locator('section.ex');
  const done = () => page.locator('.sheet').isVisible();
  if (kind === 'match') {
    while (!(await done())) {
      const [left] = await enabled(ex.locator('.match__col').first().locator('button'));
      if (!left) break;
      for (const right of await enabled(ex.locator('.match__col').nth(1).locator('button'))) {
        await press(left);
        await press(right);
        if (!(await left.isEnabled()) || (await done())) break;
      }
    }
  } else if (kind === 'order') {
    while (!(await done())) {
      const chips = await enabled(ex.locator('.ex__chips button'));
      for (const chip of chips) {
        const before = await ex.locator('.order__placed li').count();
        await press(chip);
        if ((await ex.locator('.order__placed li').count()) > before) break;
      }
    }
  } else if (kind === 'spot') {
    for (const w of await ex.locator('.spot__w').all()) {
      if (await done()) break;
      await press(w);
    }
  } else if (kind === 'map') {
    while (!(await done())) {
      const words = await ex.locator('.map__bank button').all();
      const before = await ex.locator('.map__fill').count();
      for (const w of words) {
        await press(w);
        if ((await ex.locator('.map__fill').count()) > before || (await done())) break;
      }
    }
  }
}

async function playLesson(page: Page, press: Press): Promise<Set<string>> {
  const kinds = new Set<string>();
  for (let guard = 0; guard < 200; guard++) {
    if (await page.locator('#done-title').isVisible()) return kinds;
    const gotIt = page.getByRole('button', { name: 'فهمت، يلا نتمرّن' });
    const next = page.locator('.sheet').getByRole('button', { name: 'كمّل' });
    if (await next.isVisible()) {
      await press(next);
      continue;
    }
    if (await gotIt.isVisible()) {
      await press(gotIt);
      continue;
    }
    const ex = page.locator('section.ex');
    await expect(ex).toBeVisible();
    const kind = (await ex.getAttribute('data-kind'))!;
    kinds.add(kind);
    if (['match', 'order', 'spot', 'map'].includes(kind)) await solveStep(page, kind, press);
    else await press(ex.locator('.opt').first());
    await expect(page.locator('.sheet')).toBeVisible();
    // feedback always says right/wrong in words, never colour alone
    await expect(page.locator('.fb__head')).toContainText(/[✔✘]/);
  }
  throw new Error('lesson did not finish');
}

async function noOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test('play Madd lesson 1 end to end with taps', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'ابدأ أول درس' }).click();
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
