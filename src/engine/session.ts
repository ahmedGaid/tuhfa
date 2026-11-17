/**
 * Session builder + runtime (contracts/exercise-generator.md). Pure: all randomness comes from the
 * Rng passed in. Builds: teach card (new concept, not yet seen) → `size` items in a weighted mix of
 * kinds. While playing, a wrong item comes back 3–5 steps later, at most 2 extra times (FR-009).
 */
import type { Concept, ParsedModule, RankCard } from '../content/schema.ts';
import { generators } from './generators/index.ts';
import { between, pick, shuffle, type Rng } from './rng.ts';
import type { Grade, GenContext, Item, ItemKind, MapLevel } from './types.ts';

export type ParsedLessonSpec = ParsedModule['units'][number]['lessons'][number];

export type Step =
  | { type: 'teach'; concept: Concept }
  | { type: 'rank-card'; card: RankCard }
  | { type: 'item'; item: Item; tries: number };

/** Default mix. `order` only appears where the lesson asks for it or in the module checkpoint. */
const WEIGHTS: Record<ItemKind, number> = {
  classify: 3,
  amount: 2,
  ruling: 1,
  'tf-amount': 1,
  'tf-concept': 2,
  fill: 2,
  match: 1,
  order: 1,
  spot: 2,
  map: 1,
  question: 2,
};

export const MAX_RETRIES = 2;

function caps(lesson: ParsedLessonSpec): Partial<Record<ItemKind, number>> {
  const big = lesson.kind === 'module-checkpoint';
  const onlyFew = lesson.types !== undefined && lesson.types.length <= 2;
  return {
    map: 1,
    match: big ? 2 : 1,
    order: onlyFew ? 2 : 1,
    spot: big ? 3 : 2,
    ruling: 2,
  };
}

function allowedKinds(lesson: ParsedLessonSpec): ItemKind[] {
  if (lesson.types) return lesson.types;
  const all = Object.keys(WEIGHTS) as ItemKind[];
  return lesson.kind === 'module-checkpoint' ? all : all.filter((k) => k !== 'order');
}

function mapLevel(lesson: ParsedLessonSpec, rng: Rng): MapLevel {
  if (lesson.kind === 'lesson') return rng() < 0.5 ? 1 : 2;
  if (lesson.kind === 'checkpoint') return 3;
  return rng() < 0.5 ? 3 : 4;
}

function weighted(kinds: ItemKind[], rng: Rng): ItemKind {
  const total = kinds.reduce((s, k) => s + WEIGHTS[k], 0);
  let r = rng() * total;
  for (const k of kinds) {
    r -= WEIGHTS[k];
    if (r < 0) return k;
  }
  return kinds[kinds.length - 1]!;
}

/** Spread kinds so the same kind rarely comes twice in a row (keeps the first two in place). */
function spread(items: Item[]): Item[] {
  const head = items.slice(0, 2);
  const rest = items.slice(2);
  const out = [...head];
  while (rest.length) {
    const prev = out[out.length - 1]?.kind;
    const i = rest.findIndex((x) => x.kind !== prev);
    out.push(...rest.splice(i === -1 ? 0 : i, 1));
  }
  return out;
}

export interface BuildOptions {
  /** concepts whose teach card was already seen (M4 progress); default: show it */
  seen?: ReadonlySet<string>;
}

export function buildSession(
  module: ParsedModule,
  lesson: ParsedLessonSpec,
  rng: Rng,
  opts: BuildOptions = {},
): Step[] {
  const byId = new Map(module.concepts.map((c) => [c.id, c]));
  const pool = lesson.practise.map((id) => byId.get(id)).filter((c): c is Concept => !!c);
  const fresh = lesson.newConcept ? byId.get(lesson.newConcept) : undefined;

  const steps: Step[] = [];
  if (fresh && !opts.seen?.has(fresh.id)) steps.push({ type: 'teach', concept: fresh });
  if (lesson.teachCard === 'rank' && module.extras?.rankCard)
    steps.push({ type: 'rank-card', card: module.extras.rankCard });

  const limit = caps(lesson);
  const kinds = allowedKinds(lesson);
  const count: Partial<Record<ItemKind, number>> = {};
  const misses: Partial<Record<ItemKind, number>> = {};
  const dead = new Set<ItemKind>();
  const keys = new Set<string>();
  const items: Item[] = [];
  const level = mapLevel(lesson, rng);

  for (let attempt = 0; items.length < lesson.size && attempt < lesson.size * 40; attempt++) {
    const open = kinds.filter((k) => !dead.has(k) && (count[k] ?? 0) < (limit[k] ?? Infinity));
    if (!open.length) break;
    const kind = weighted(open, rng);
    // the first items are about the new concept, then it keeps ~40% of the session
    const focus =
      fresh && (items.length < 2 || rng() < 0.4) ? fresh : (pick(pool, rng) ?? fresh ?? undefined);
    const ctx: GenContext = {
      module,
      focus,
      pool,
      level,
      topics: lesson.topics,
      mapBlanks: lesson.kind === 'lesson' ? 3 : 5,
    };
    const item = generators[kind].build(ctx, rng);
    if (!item || keys.has(item.key)) {
      misses[kind] = (misses[kind] ?? 0) + 1;
      if (misses[kind]! > 15) dead.add(kind);
      continue;
    }
    keys.add(item.key);
    count[kind] = (count[kind] ?? 0) + 1;
    items.push(item);
  }

  for (const item of spread(items)) steps.push({ type: 'item', item, tries: 0 });
  return steps;
}

// ---------------------------------------------------------------- runtime

export interface SessionState {
  steps: Step[];
  index: number;
  answered: number;
  correct: number;
  combo: number;
  hadMistake: boolean;
  /** concept ids answered right / wrong, in order (for SRS + mistakes in M4) */
  right: string[];
  wrong: string[];
}

export function startSession(steps: Step[]): SessionState {
  return { steps, index: 0, answered: 0, correct: 0, combo: 0, hadMistake: false, right: [], wrong: [] };
}

export const currentStep = (s: SessionState): Step | undefined => s.steps[s.index];
export const isFinished = (s: SessionState): boolean => s.index >= s.steps.length;
export const progressOf = (s: SessionState): number => (s.steps.length ? s.index / s.steps.length : 1);

/** Re-shuffle options so a returning item is not answered from memory of the position. */
function reshuffle(item: Item, rng: Rng): Item {
  if (item.mode !== 'choice') return item;
  const right = item.options[item.answer]!;
  const options = shuffle(item.options, rng);
  return { ...item, options, answer: options.indexOf(right) };
}

/** Record the grade of the current item step. A wrong answer re-queues it (max 2 extra times). */
export function recordAnswer(s: SessionState, g: Grade, rng: Rng): SessionState {
  const step = s.steps[s.index];
  if (!step || step.type !== 'item') return s;
  const concept = step.item.concept;
  const next: SessionState = {
    ...s,
    answered: s.answered + 1,
    correct: s.correct + (g.correct ? 1 : 0),
    combo: g.correct ? s.combo + 1 : 0,
    hadMistake: s.hadMistake || !g.correct,
    right: g.correct && concept ? [...s.right, concept] : s.right,
    wrong: !g.correct && concept ? [...s.wrong, concept] : s.wrong,
  };
  if (!g.correct && step.tries < MAX_RETRIES) {
    const at = Math.min(s.steps.length, s.index + between(3, 5, rng));
    const steps = s.steps.slice();
    steps.splice(at, 0, { type: 'item', item: reshuffle(step.item, rng), tries: step.tries + 1 });
    next.steps = steps;
  }
  return next;
}

/** Move past the current step (teach card, or an item after its feedback). */
export const advance = (s: SessionState): SessionState => ({ ...s, index: s.index + 1 });

/** Will a wrong answer on the current step bring it back? (feedback sheet wording) */
export function willReturn(s: SessionState): boolean {
  const step = s.steps[s.index];
  return step?.type === 'item' && step.tries < MAX_RETRIES;
}
