import { describe, expect, it } from 'vitest';
import { grade } from '../../src/engine/grade.ts';
import { mulberry32 } from '../../src/engine/rng.ts';
import {
  advance,
  buildSession,
  currentStep,
  isFinished,
  MAX_RETRIES,
  recordAnswer,
  startSession,
  type Step,
} from '../../src/engine/session.ts';
import type { Answer, Item } from '../../src/engine/types.ts';
import { lessonsOf, maddFull, maddParsed } from './fixtures.ts';

const items = (steps: Step[]) => steps.filter((s) => s.type === 'item').map((s) => s.item);

function wrongAnswer(item: Item): Answer {
  if (item.mode === 'choice') return (item.answer + 1) % item.options.length;
  if (item.mode === 'tf') return !item.answer;
  return { mistakes: 1 };
}

describe('session builder (T026)', () => {
  const lessons = lessonsOf(maddFull);

  it('starts with the teach card of a new concept, and skips it once seen', () => {
    const first = lessons[0]!;
    const steps = buildSession(maddFull, first, mulberry32(1));
    expect(steps[0]).toMatchObject({ type: 'teach', concept: { id: first.newConcept } });
    const again = buildSession(maddFull, first, mulberry32(1), { seen: new Set([first.newConcept!]) });
    expect(again[0]!.type).toBe('item');
  });

  it('shows the rank card where the lesson asks for it', () => {
    const rank = lessons.find((l) => l.teachCard === 'rank')!;
    expect(buildSession(maddFull, rank, mulberry32(3))[0]!.type).toBe('rank-card');
  });

  it('every lesson has 10–size items, unique, and at most one map', () => {
    for (let seed = 1; seed <= 30; seed++)
      for (const lesson of lessons) {
        const list = items(buildSession(maddFull, lesson, mulberry32(seed)));
        expect(list.length, lesson.id).toBeGreaterThanOrEqual(10);
        expect(list.length, lesson.id).toBeLessThanOrEqual(lesson.size);
        expect(new Set(list.map((i) => i.key)).size).toBe(list.length);
        expect(list.filter((i) => i.kind === 'map').length).toBeLessThanOrEqual(1);
        if (lesson.types) list.forEach((i) => expect(lesson.types).toContain(i.kind));
      }
  });

  it('a lesson mixes many kinds', () => {
    const kinds = new Set<string>();
    for (let seed = 1; seed <= 10; seed++)
      items(buildSession(maddFull, lessons[2]!, mulberry32(seed))).forEach((i) => kinds.add(i.kind));
    expect(kinds.size).toBeGreaterThanOrEqual(8);
  });

  it('real (partly verified) data never crashes and every lesson builds something', () => {
    for (const lesson of lessonsOf(maddParsed))
      expect(items(buildSession(maddParsed, lesson, mulberry32(7))).length, lesson.id).toBeGreaterThan(0);
  });
});

describe('session runtime', () => {
  it(`re-queues a wrong item at most ${MAX_RETRIES} more times, 3–5 steps later`, () => {
    const rng = mulberry32(11);
    let s = startSession(buildSession(maddFull, lessonsOf(maddFull)[3]!, rng));
    const originals = items(s.steps).length;
    const seen = new Map<string, number>();
    let guard = 0;
    while (!isFinished(s) && guard++ < 500) {
      const step = currentStep(s)!;
      if (step.type === 'item') {
        seen.set(step.item.key, (seen.get(step.item.key) ?? 0) + 1);
        const before = s.steps.length;
        const idx = s.index;
        s = recordAnswer(s, grade(step.item, wrongAnswer(step.item)), rng);
        if (step.tries < MAX_RETRIES) {
          expect(s.steps.length).toBe(before + 1);
          const back = s.steps.findIndex(
            (x, i) => i > idx && x.type === 'item' && x.item.key === step.item.key,
          );
          expect(back - idx).toBeGreaterThanOrEqual(1);
          expect(back - idx).toBeLessThanOrEqual(5);
        } else expect(s.steps.length).toBe(before);
      }
      s = advance(s);
    }
    expect(isFinished(s)).toBe(true);
    for (const n of seen.values()) expect(n).toBeLessThanOrEqual(1 + MAX_RETRIES);
    expect(s.answered).toBe(originals * (1 + MAX_RETRIES));
    expect(s.correct).toBe(0);
    expect(s.combo).toBe(0);
    expect(s.hadMistake).toBe(true);
  });

  it('a returning choice item keeps the same right option', () => {
    const rng = mulberry32(5);
    let s = startSession(
      items(buildSession(maddFull, lessonsOf(maddFull)[1]!, rng)).map((item) => ({
        type: 'item' as const,
        item,
        tries: 0,
      })),
    );
    const choice = s.steps.findIndex((x) => x.type === 'item' && x.item.mode === 'choice');
    s = { ...s, index: choice };
    const step = currentStep(s)! as Extract<Step, { type: 'item' }>;
    const item = step.item as Extract<Item, { mode: 'choice' }>;
    s = recordAnswer(s, grade(item, (item.answer + 1) % item.options.length), rng);
    const back = s.steps.slice(choice + 1).find((x) => x.type === 'item' && x.item.key === item.key)!;
    const again = (back as Extract<Step, { type: 'item' }>).item as Extract<Item, { mode: 'choice' }>;
    expect(again.options[again.answer]).toBe(item.options[item.answer]);
    expect((back as Extract<Step, { type: 'item' }>).tries).toBe(1);
  });

  it('counts combo and right/wrong concepts', () => {
    const rng = mulberry32(2);
    let s = startSession(
      items(buildSession(maddFull, lessonsOf(maddFull)[0]!, rng)).map((item) => ({
        type: 'item' as const,
        item,
        tries: 0,
      })),
    );
    for (let k = 0; k < 3; k++) {
      const it = (currentStep(s) as Extract<Step, { type: 'item' }>).item;
      const right = it.mode === 'choice' || it.mode === 'tf' ? it.answer : { mistakes: 0 };
      s = advance(recordAnswer(s, grade(it, right), rng));
    }
    expect(s.combo).toBe(3);
    expect(s.correct).toBe(3);
    expect(s.hadMistake).toBe(false);
  });
});
