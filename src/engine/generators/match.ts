/** «وصّل» — match each concept name to its Quran example (3–4 pairs, no cross-tagged example). */
import type { Concept, Example } from '../../content/schema.ts';
import { shuffle } from '../rng.ts';
import type { Generator, MatchItem } from '../types.ts';
import { ownExamples, toView } from './util.ts';

const MIN = 3;
const MAX = 4;

export const match: Generator = {
  kind: 'match',
  build({ module, focus, pool }, rng): MatchItem | null {
    const sameCat = focus ? module.concepts.filter((c) => c.category === focus.category) : [];
    const candidates = [
      ...(focus ? [focus] : []),
      ...shuffle(pool, rng),
      ...shuffle(sameCat, rng),
      ...shuffle(module.concepts, rng),
    ];
    const chosen: { c: Concept; e: Example }[] = [];
    for (const c of candidates) {
      if (chosen.length === MAX) break;
      if (chosen.some((p) => p.c.id === c.id || p.c.name === c.name)) continue;
      // the example must not also show another chosen concept, and vice versa
      const e = shuffle(ownExamples(c), rng).find(
        (x) =>
          !chosen.some((p) => x.tags.includes(p.c.id) || p.e.tags.includes(c.id) || p.e.quran === x.quran),
      );
      if (e) chosen.push({ c, e });
    }
    if (chosen.length < MIN) return null;
    const pairs = chosen.map(({ c, e }) => ({ left: c.name, right: toView(e), category: c.category }));
    return {
      mode: 'match',
      kind: 'match',
      key: `match:${chosen
        .map((p) => p.c.id)
        .sort()
        .join(',')}`,
      concept: focus?.id,
      category: focus?.category,
      prompt: module.prompts.match,
      pairs,
      rightOrder: shuffle(
        pairs.map((_, i) => i),
        rng,
      ),
      explain: chosen.map((p) => `${p.c.name}: ${p.e.label ?? p.e.quran}`).join(' · '),
    };
  },
};
