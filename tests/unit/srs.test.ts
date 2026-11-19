import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../src/engine/rng.ts';
import {
  applyAnswers,
  buildReview,
  demote,
  dueKeys,
  INTERVALS,
  promote,
  REVIEW_KINDS,
} from '../../src/engine/srs.ts';
import { applyReview } from '../../src/state/progress.ts';
import { freshProgress } from '../../src/state/schema.ts';
import { maddFull } from './fixtures.ts';

const day = '2026-11-19';

describe('Leitner boxes', () => {
  it('uses intervals 1/2/4/7/14', () => {
    expect([...INTERVALS]).toEqual([1, 2, 4, 7, 14]);
  });

  it('a new concept answered right enters box 1, due tomorrow', () => {
    expect(promote(undefined, day)).toEqual({ box: 1, due: '2026-11-20', wrong: 0 });
  });

  it('each right answer moves one box up with that box interval, capped at 5', () => {
    const dues = ['2026-11-20', '2026-11-21', '2026-11-23', '2026-11-26', '2026-12-03'];
    let e = undefined as ReturnType<typeof promote> | undefined;
    for (let box = 1; box <= 5; box++) {
      e = promote(e, day);
      expect(e).toMatchObject({ box, due: dues[box - 1] });
    }
    expect(promote(e, day)).toMatchObject({ box: 5, due: '2026-12-03' });
  });

  it('a wrong answer drops to box 1, due tomorrow, and counts the misses', () => {
    expect(demote({ box: 4, due: '2026-12-01', wrong: 1 }, day, 2)).toEqual({
      box: 1,
      due: '2026-11-20',
      wrong: 3,
    });
  });

  it('applyAnswers: missed once in the session wins over right answers; right moves only one box', () => {
    const key = (c: string) => `m/${c}`;
    const srs = applyAnswers(
      { 'm/a': { box: 2, due: day, wrong: 0 }, 'm/b': { box: 3, due: day, wrong: 0 } },
      key,
      ['a', 'a', 'a', 'b'],
      ['b'],
      day,
    );
    expect(srs['m/a']).toMatchObject({ box: 3 });
    expect(srs['m/b']).toMatchObject({ box: 1, wrong: 1 });
  });

  it('crosses month and year ends', () => {
    expect(promote({ box: 4, due: '', wrong: 0 }, '2026-12-25').due).toBe('2027-01-08');
  });
});

describe('due selection', () => {
  const srs = {
    'm/late': { box: 2, due: '2026-11-10', wrong: 0 },
    'm/today-hi': { box: 3, due: day, wrong: 0 },
    'm/today-lo': { box: 1, due: day, wrong: 0 },
    'm/later': { box: 1, due: '2026-11-20', wrong: 0 },
  };

  it('takes concepts due today or earlier, most overdue first, then lowest box', () => {
    expect(dueKeys(srs, day)).toEqual(['m/late', 'm/today-lo', 'm/today-hi']);
  });

  it('nothing is due on a fresh start', () => {
    expect(dueKeys({}, day)).toEqual([]);
  });

  it('advancing the clock makes later concepts due', () => {
    expect(dueKeys(srs, '2026-11-20')).toContain('m/later');
  });
});

describe('review session', () => {
  const m = maddFull;
  const ids = m.concepts.slice(0, 3).map((c) => c.id);

  it('builds items only about the given concepts, with no teach card', () => {
    const steps = buildReview(m, ids, mulberry32(7));
    expect(steps.length).toBeGreaterThan(0);
    for (const s of steps) {
      expect(s.type).toBe('item');
      if (s.type !== 'item') continue;
      expect(REVIEW_KINDS).toContain(s.item.kind);
      if (s.item.concept) expect(ids).toContain(s.item.concept);
    }
  });

  it('drops unknown ids and returns nothing when none are left', () => {
    expect(buildReview(m, ['no-such-concept'], mulberry32(1))).toEqual([]);
  });

  it('is repeatable with the same seed', () => {
    const keys = (seed: number) =>
      buildReview(m, ids, mulberry32(seed)).map((s) => (s.type === 'item' ? s.item.key : s.type));
    expect(keys(42)).toEqual(keys(42));
  });
});

describe('applyReview', () => {
  it('right in review moves a box up and clears it from mistakes; wrong goes to box 1 and to the front', () => {
    const p = {
      ...freshProgress(),
      srs: {
        'madd/a': { box: 1, due: day, wrong: 1 },
        'madd/b': { box: 3, due: day, wrong: 0 },
      },
      mistakes: ['madd/a', 'madd/c'],
    };
    const out = applyReview(p, { moduleId: 'madd', xp: 30, right: ['a'], wrong: ['b'] }, day);
    expect(out.srs['madd/a']).toMatchObject({ box: 2, due: '2026-11-21' });
    expect(out.srs['madd/b']).toMatchObject({ box: 1, due: '2026-11-20', wrong: 1 });
    expect(out.mistakes).toEqual(['madd/b', 'madd/c']);
    expect(out.xp.total).toBe(30);
    expect(out.streak.count).toBe(1);
    expect(out.lessons).toEqual({});
  });
});
