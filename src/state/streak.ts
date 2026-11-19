/** Streak + daily goal (data-model.md state transitions). Pure. */
import { addDays, type Day } from './date.ts';
import type { Progress } from './schema.ts';

export type Streak = Progress['streak'];

/** A finished lesson on `day`: same day → unchanged; the day after lastDay → +1; else → 1. */
export function bumpStreak(s: Streak, day: Day): Streak {
  if (s.lastDay === day) return s;
  const count = s.lastDay === addDays(day, -1) ? s.count + 1 : 1;
  return { count, lastDay: day };
}

/** What the flame shows: a streak older than yesterday is already broken → 0. */
export function shownStreak(s: Streak, day: Day): number {
  return s.lastDay === day || s.lastDay === addDays(day, -1) ? s.count : 0;
}

export const xpOn = (p: Progress, day: Day): number => p.xp.byDay[day] ?? 0;

/** Daily-goal ring fill, 0..1. */
export const goalFill = (xp: number, goal: number): number => (goal > 0 ? Math.min(1, xp / goal) : 0);
