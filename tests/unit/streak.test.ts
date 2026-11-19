import { describe, expect, it } from 'vitest';
import { addDays, dayOf } from '../../src/state/date.ts';
import { bumpStreak, goalFill, shownStreak } from '../../src/state/streak.ts';

describe('dates', () => {
  it('formats the local date and adds days across month and year ends', () => {
    expect(dayOf(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('streak', () => {
  const none = { count: 0, lastDay: null };

  it('starts at 1 on the first lesson', () => {
    expect(bumpStreak(none, '2026-11-18')).toEqual({ count: 1, lastDay: '2026-11-18' });
  });

  it('a second lesson the same day changes nothing', () => {
    const s = { count: 3, lastDay: '2026-11-18' };
    expect(bumpStreak(s, '2026-11-18')).toBe(s);
  });

  it('the next day adds one', () => {
    expect(bumpStreak({ count: 3, lastDay: '2026-11-18' }, '2026-11-19')).toEqual({
      count: 4,
      lastDay: '2026-11-19',
    });
  });

  it('a missed day resets to 1', () => {
    expect(bumpStreak({ count: 9, lastDay: '2026-11-16' }, '2026-11-18').count).toBe(1);
  });

  it('shows 0 once a day was missed, before any new lesson', () => {
    const s = { count: 5, lastDay: '2026-11-16' };
    expect(shownStreak(s, '2026-11-17')).toBe(5);
    expect(shownStreak(s, '2026-11-18')).toBe(0);
    expect(shownStreak(none, '2026-11-18')).toBe(0);
  });

  it('daily-goal ring fills proportionally and stops at full', () => {
    expect(goalFill(0, 20)).toBe(0);
    expect(goalFill(10, 20)).toBe(0.5);
    expect(goalFill(130, 100)).toBe(1);
  });
});
