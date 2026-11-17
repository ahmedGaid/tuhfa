import { describe, expect, it } from 'vitest';
import madd from '../../src/content/modules/madd/index.ts';
import { eligibleExamples, isUnambiguous } from '../../src/engine/ambiguity.ts';
import { mulberry32, shuffle } from '../../src/engine/rng.ts';

// research R6 — for «صنّف» / «صح ولا غلط», the correct answer is the only option in the example's tags
describe('ambiguity rule', () => {
  it('drops an example that also carries a concept offered as a wrong option', () => {
    const ex = [
      { quran: 'a', tags: ['badal', 'tamk'], verified: true },
      { quran: 'b', tags: ['badal'], verified: true },
      { quran: 'c', tags: ['badal'], verified: false },
    ];
    expect(eligibleExamples(ex, 'badal', ['badal', 'tamk', 'munf']).map((e) => e.quran)).toEqual(['b']);
    expect(eligibleExamples(ex, 'badal', ['badal', 'munf', 'mutt']).map((e) => e.quran)).toEqual(['a', 'b']);
  });

  it('500 seeded sessions on the Madd data never produce an ambiguous item', () => {
    const ids = madd.concepts.map((c) => c.id);
    let items = 0;
    for (let seed = 1; seed <= 500; seed++) {
      const rnd = mulberry32(seed);
      for (const c of shuffle(madd.concepts, rnd)) {
        const others = ids.filter((i) => i !== c.id);
        // «صنّف»: 4 options; «صح ولا غلط»: the claimed concept is the target or one other
        const classify = [c.id, ...shuffle(others, rnd).slice(0, 3)];
        const tf = [c.id, shuffle(others, rnd)[0]!];
        for (const options of [classify, tf]) {
          const pool = eligibleExamples(c.examples, c.id, options);
          if (!pool.length) continue; // the generator must pick other options or another type
          const e = pool[Math.floor(rnd() * pool.length)]!;
          expect(isUnambiguous(e, c.id, options)).toBe(true);
          items++;
        }
      }
    }
    // some concepts already have verified examples, so the loop really exercised the rule
    expect(items).toBeGreaterThan(0);
  });
});
