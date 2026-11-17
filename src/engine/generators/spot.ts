/** «لوّن الحكم» — tap every word of a verified ayah that holds the concept (indexes: research R7). */
import { pick } from '../rng.ts';
import { spotWords } from '../spot.ts';
import type { Generator, SpotItemView } from '../types.ts';
import { fillTemplate } from './util.ts';

export const spot: Generator = {
  kind: 'spot',
  build({ module, focus, pool }, rng): SpotItemView | null {
    const ids = new Set(pool.map((c) => c.id));
    const all = (module.spot ?? []).filter((s) => s.verified && ids.has(s.concept));
    // prefer the focus concept's ayat when it has some
    const own = focus ? all.filter((s) => s.concept === focus.id) : [];
    const s = pick(own.length ? own : all, rng);
    if (!s) return null;
    const words = spotWords(s.ayah);
    if (s.answer.some((i) => i >= words.length)) return null;
    const concept = module.concepts.find((c) => c.id === s.concept);
    return {
      mode: 'spot',
      kind: 'spot',
      key: `spot:${s.id}`,
      concept: s.concept,
      category: concept?.category,
      prompt: fillTemplate(module.prompts.spot, { title: s.title, name: concept?.name }),
      words,
      answer: s.answer.slice(),
      ref: s.ref,
      explain: s.note,
      example: { quran: s.ayah, note: s.note, ref: s.ref },
    };
  },
};
