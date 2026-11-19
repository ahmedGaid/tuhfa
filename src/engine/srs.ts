/**
 * Leitner spaced repetition (spec US4, FR-012) + the review session builder. Content-free: it works
 * on concept ids and a parsed module, like the lesson builder. Days are local `YYYY-MM-DD` strings.
 */
import type { ParsedModule } from '../content/schema.ts';
import type { Rng } from './rng.ts';
import { buildSession, type ParsedLessonSpec, type Step } from './session.ts';
import type { ItemKind } from './types.ts';

/** Days until the next review for boxes 1..5. */
export const INTERVALS = [1, 2, 4, 7, 14] as const;
export const MAX_BOX = INTERVALS.length;

export interface SrsEntry {
  box: number;
  due: string;
  wrong: number;
}

/** Same calendar arithmetic as state/date.ts (kept here so the engine imports nothing from state). */
function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const x = new Date(y!, m! - 1, d! + n);
  const p = (v: number) => String(v).padStart(2, '0');
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}

/** Right answer: one box up (a new concept enters box 1), due after that box's interval. */
export function promote(cur: SrsEntry | undefined, day: string): SrsEntry {
  const box = Math.min(MAX_BOX, (cur?.box ?? 0) + 1);
  return { box, due: addDays(day, INTERVALS[box - 1]!), wrong: cur?.wrong ?? 0 };
}

/** Wrong answer(s): back to box 1, due tomorrow. */
export function demote(cur: SrsEntry | undefined, day: string, times = 1): SrsEntry {
  return { box: 1, due: addDays(day, INTERVALS[0]), wrong: (cur?.wrong ?? 0) + times };
}

/**
 * Apply one session's answers to the boxes. A concept missed at least once in the session drops to
 * box 1; a concept only ever answered right moves up exactly one box (however often it came up).
 */
export function applyAnswers(
  srs: Readonly<Record<string, SrsEntry>>,
  key: (conceptId: string) => string,
  right: readonly string[],
  wrong: readonly string[],
  day: string,
): Record<string, SrsEntry> {
  const out = { ...srs };
  const misses = new Map<string, number>();
  for (const c of wrong) misses.set(c, (misses.get(c) ?? 0) + 1);
  for (const c of new Set([...right, ...wrong])) {
    const k = key(c);
    out[k] = misses.has(c) ? demote(out[k], day, misses.get(c)) : promote(out[k], day);
  }
  return out;
}

/** Keys due on `day` (due date today or earlier): most overdue first, then lowest box. */
export function dueKeys(srs: Readonly<Record<string, SrsEntry>>, day: string): string[] {
  return Object.entries(srs)
    .filter(([, e]) => e.due <= day)
    .sort(([ka, a], [kb, b]) => a.due.localeCompare(b.due) || a.box - b.box || ka.localeCompare(kb))
    .map(([k]) => k);
}

/** Exercise kinds a review uses: the ones about a single concept (no module-wide «رتّب» / map / bank). */
export const REVIEW_KINDS: ItemKind[] = [
  'classify',
  'amount',
  'ruling',
  'tf-amount',
  'tf-concept',
  'fill',
  'match',
  'spot',
];

/** At most this many concepts in one review session. */
export const REVIEW_CONCEPTS = 8;
export const REVIEW_SIZE = 10;

/**
 * Review session over the given concept ids of one module (no teach cards). Unknown ids are dropped;
 * returns [] when nothing is left to practise.
 */
export function buildReview(module: ParsedModule, conceptIds: readonly string[], rng: Rng): Step[] {
  const known = new Set(module.concepts.map((c) => c.id));
  const practise = [...new Set(conceptIds)].filter((id) => known.has(id)).slice(0, REVIEW_CONCEPTS);
  if (!practise.length) return [];
  const spec: ParsedLessonSpec = {
    id: 'review',
    title: 'review',
    practise,
    kind: 'lesson',
    types: REVIEW_KINDS,
    size: REVIEW_SIZE,
  };
  // every concept counts as already taught: a review never shows a teach card
  return buildSession(module, spec, rng, { seen: new Set(practise) });
}
