import { describe, expect, it } from 'vitest';
import { isUnambiguous } from '../../src/engine/ambiguity.ts';
import { generators } from '../../src/engine/generators/index.ts';
import { grade } from '../../src/engine/grade.ts';
import { mulberry32 } from '../../src/engine/rng.ts';
import { spotWords } from '../../src/engine/spot.ts';
import type { GenContext, Item, ItemKind, MapLevel } from '../../src/engine/types.ts';
import type { ParsedModule } from '../../src/content/schema.ts';
import { maddFull, maddParsed, templateParsed, verifiedStrings } from './fixtures.ts';

const KINDS = Object.keys(generators) as ItemKind[];

/** Build many items of every kind over every lesson of a module. */
function sweep(m: ParsedModule, seeds = 40): Map<ItemKind, Item[]> {
  const out = new Map<ItemKind, Item[]>(KINDS.map((k) => [k, []]));
  const byId = new Map(m.concepts.map((c) => [c.id, c]));
  for (let seed = 1; seed <= seeds; seed++) {
    const rng = mulberry32(seed);
    for (const lesson of m.units.flatMap((u) => u.lessons)) {
      const pool = lesson.practise.map((id) => byId.get(id)!);
      for (const focus of pool.length ? pool : [undefined]) {
        for (const kind of KINDS) {
          const ctx: GenContext = {
            module: m,
            focus,
            pool,
            topics: lesson.topics,
            level: ((seed % 4) + 1) as MapLevel,
          };
          const item = generators[kind].build(ctx, rng);
          if (item) out.get(kind)!.push(item);
        }
      }
    }
  }
  return out;
}

/** Quran strings an item shows to the learner. */
function quranShown(item: Item): string[] {
  const s: string[] = [];
  if (item.example) s.push(item.example.quran);
  if ((item.mode === 'choice' || item.mode === 'tf') && item.shown) s.push(item.shown.quran);
  if (item.mode === 'match') item.pairs.forEach((p) => s.push(p.right.quran));
  if (item.mode === 'map') item.nodes.forEach((n) => n.quran && s.push(n.quran));
  return s;
}

function assertValid(item: Item, m: ParsedModule) {
  expect(item.key).toBeTruthy();
  switch (item.mode) {
    case 'choice': {
      expect(item.options.length).toBeGreaterThanOrEqual(2);
      expect(item.options.length).toBeLessThanOrEqual(4);
      expect(new Set(item.options).size).toBe(item.options.length);
      expect(item.answer).toBeGreaterThanOrEqual(0);
      expect(item.answer).toBeLessThan(item.options.length);
      if (item.kind === 'classify') {
        const ids = item.options.map((o) => m.concepts.find((c) => c.name === o)!.id);
        const focus = m.concepts.find((c) => c.id === item.concept)!;
        const ex = focus.examples.find((e) => e.quran === item.shown!.quran)!;
        expect(isUnambiguous(ex, focus.id, ids)).toBe(true);
      }
      break;
    }
    case 'tf':
      expect(typeof item.answer).toBe('boolean');
      expect(item.truth).toBeTruthy();
      break;
    case 'match':
      expect(item.pairs.length).toBeGreaterThanOrEqual(3);
      expect([...item.rightOrder].sort()).toEqual(item.pairs.map((_, i) => i));
      // no example also shows another listed concept
      for (const p of item.pairs) {
        const own = m.concepts.find((c) => c.name === p.left)!;
        const ex = own.examples.find((e) => e.quran === p.right.quran)!;
        const others = item.pairs
          .filter((q) => q !== p)
          .map((q) => m.concepts.find((c) => c.name === q.left)!.id);
        expect(ex.tags.some((t) => others.includes(t))).toBe(false);
      }
      break;
    case 'order':
      expect([...item.chipOrder].sort((a, b) => a - b)).toEqual(item.items.map((_, i) => i));
      expect(item.chipOrder.every((v, i) => v === i)).toBe(false);
      break;
    case 'spot':
      expect(item.words).toEqual(spotWords(item.example!.quran));
      item.answer.forEach((i) => expect(i).toBeLessThan(item.words.length));
      break;
    case 'map': {
      const blanks = item.nodes.filter((n) => n.blank);
      expect(blanks.length).toBeGreaterThanOrEqual(2);
      blanks.forEach((n) => expect(item.bank).toContain(item.fills[n.id]));
      expect(new Set(item.bank).size).toBe(item.bank.length);
      break;
    }
  }
}

describe('generators (T025)', () => {
  const full = sweep(maddFull);

  it.each(KINDS)('%s builds valid items for Madd', (kind) => {
    const items = full.get(kind)!;
    expect(items.length).toBeGreaterThan(0);
    items.forEach((i) => {
      expect(i.kind).toBe(kind);
      assertValid(i, maddFull);
    });
  });

  it('never shows an unverified Quran string (real data)', () => {
    const allowed = verifiedStrings(maddParsed);
    const real = sweep(maddParsed, 20);
    let n = 0;
    for (const items of real.values())
      for (const item of items)
        for (const q of quranShown(item)) {
          expect(allowed.has(q), `unverified: ${q} in ${item.key}`).toBe(true);
          n++;
        }
    expect(n).toBeGreaterThan(0);
  });

  it('works on the _template module with no engine change', () => {
    const items = sweep(templateParsed, 5);
    // one concept only: the ruling item is the one that can be built; the rest return null cleanly
    expect(items.get('ruling')!.length).toBeGreaterThan(0);
    for (const list of items.values()) list.forEach((i) => assertValid(i, templateParsed));
  });

  it('grade is pure and right only for the right answer', () => {
    for (const items of full.values())
      for (const item of items.slice(0, 5)) {
        const frozen = structuredClone(item);
        Object.freeze(item);
        const right =
          item.mode === 'choice' ? item.answer : item.mode === 'tf' ? item.answer : { mistakes: 0 };
        const wrong =
          item.mode === 'choice'
            ? (item.answer + 1) % item.options.length
            : item.mode === 'tf'
              ? !item.answer
              : { mistakes: 1 };
        const g1 = grade(item, right);
        expect(g1.correct).toBe(true);
        expect(grade(item, right)).toEqual(g1);
        expect(grade(item, wrong).correct).toBe(false);
        expect(g1.correctAnswer).toBeTruthy();
        expect(g1.explain).toBe(item.explain);
        expect(item).toEqual(frozen);
      }
  });
});
