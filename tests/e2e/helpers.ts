import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Shared e2e helpers: play a lesson without peeking at answers (wrong picks just come back later,
 * max 2 more times; step exercises are solved by trying each option).
 */

export type Press = (l: Locator) => Promise<void>;
export const mouse: Press = (l) => l.click();
export const keyboard: Press = async (l) => {
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

export async function playLesson(page: Page, press: Press): Promise<Set<string>> {
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
    // the lesson may still be loading: wait for whatever comes first, then look again
    await expect(ex.or(gotIt).or(next).or(page.locator('#done-title')).first()).toBeVisible();
    if (!(await ex.isVisible())) continue;
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

export async function noOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

/** First visit shows the welcome; tap through it to the path. */
export async function passWelcome(page: Page) {
  await page.getByRole('button', { name: 'يلا نبدأ' }).click();
}
