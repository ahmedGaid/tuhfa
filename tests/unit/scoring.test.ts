import { describe, expect, it } from 'vitest';
import { accuracy, lessonXp, showCombo, starsFor, summarize } from '../../src/engine/scoring.ts';

describe('scoring (T027)', () => {
  it('XP: +10 per correct, +20 finish, +10 perfect', () => {
    expect(lessonXp(12, true)).toBe(12 * 10 + 20 + 10);
    expect(lessonXp(10, false)).toBe(10 * 10 + 20);
    expect(lessonXp(0, false)).toBe(20);
  });

  it('combo shows from 3 in a row', () => {
    expect(showCombo(2)).toBe(false);
    expect(showCombo(3)).toBe(true);
    expect(showCombo(7)).toBe(true);
  });

  it('stars: ≥90% = 3, ≥70% = 2, else 1', () => {
    expect(starsFor(1)).toBe(3);
    expect(starsFor(0.9)).toBe(3);
    expect(starsFor(0.899)).toBe(2);
    expect(starsFor(0.7)).toBe(2);
    expect(starsFor(0.69)).toBe(1);
    expect(starsFor(0)).toBe(1);
  });

  it('accuracy counts every answer, retries included', () => {
    expect(accuracy(0, 0)).toBe(1);
    expect(accuracy(15, 12)).toBeCloseTo(0.8);
    expect(summarize(15, 12, true)).toEqual({
      answered: 15,
      correct: 12,
      accuracy: 0.8,
      stars: 2,
      xp: 140,
      perfect: false,
    });
    expect(summarize(12, 12, false).xp).toBe(150);
  });
});
