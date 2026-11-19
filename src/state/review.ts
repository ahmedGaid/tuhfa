/** What «راجع» offers (US4): mistakes (newest first) and concepts due by Leitner, grouped by module. */
import { dueKeys } from '../engine/srs.ts';
import type { Day } from './date.ts';
import type { Progress } from './schema.ts';

export type ReviewMode = 'mistakes' | 'due';
export const isReviewMode = (s: string | undefined): s is ReviewMode => s === 'mistakes' || s === 'due';

/** `moduleId/conceptId` keys for a mode, in priority order. */
export function reviewKeys(p: Progress, mode: ReviewMode, day: Day): string[] {
  return mode === 'mistakes' ? p.mistakes : dueKeys(p.srs, day);
}

const split = (key: string) => {
  const i = key.indexOf('/');
  return { moduleId: key.slice(0, i), conceptId: key.slice(i + 1) };
};

/** Concept ids of one module, in priority order. */
export function conceptsOf(keys: readonly string[], moduleId: string): string[] {
  return keys.map(split).flatMap((k) => (k.moduleId === moduleId ? [k.conceptId] : []));
}

/** The module to review first: the one that owns the top-priority key. */
export function firstModule(keys: readonly string[]): string | undefined {
  return keys[0] === undefined ? undefined : split(keys[0]).moduleId;
}
