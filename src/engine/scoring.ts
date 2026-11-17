/** Scoring (spec US1 scenarios 5–6): XP, combo, stars. Pure. */

export const XP = { correct: 10, finish: 20, perfect: 10 } as const;
export const COMBO_AT = 3;

export type Stars = 1 | 2 | 3;

export function accuracy(answered: number, correct: number): number {
  return answered === 0 ? 1 : correct / answered;
}

/** ≥90% = 3 stars, ≥70% = 2, else 1. */
export function starsFor(acc: number): Stars {
  return acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
}

/** +10 per correct answer, +20 for finishing, +10 more when nothing was wrong. */
export function lessonXp(correct: number, perfect: boolean): number {
  return correct * XP.correct + XP.finish + (perfect ? XP.perfect : 0);
}

export const showCombo = (combo: number): boolean => combo >= COMBO_AT;

export interface LessonResult {
  answered: number;
  correct: number;
  accuracy: number;
  stars: Stars;
  xp: number;
  perfect: boolean;
}

export function summarize(answered: number, correct: number, hadMistake: boolean): LessonResult {
  const acc = accuracy(answered, correct);
  const perfect = !hadMistake;
  return { answered, correct, accuracy: acc, stars: starsFor(acc), xp: lessonXp(correct, perfect), perfect };
}
