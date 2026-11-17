/**
 * «بنك الأسئلة» — a hand-written question from the module. Drawn by the lesson's topics, else by the
 * categories of the lesson's concepts. The question's example is shown only once verified.
 */
import { pick } from '../rng.ts';
import type { ChoiceItem, Generator } from '../types.ts';
import { mixOptions, verifiedView } from './util.ts';

export const bank: Generator = {
  kind: 'question',
  build({ module, pool, topics }, rng): ChoiceItem | null {
    const qs = module.questions ?? [];
    const cats = new Set(pool.map((c) => c.category));
    const candidates = topics?.length
      ? qs.filter((q) => topics.includes(q.topic))
      : qs.filter((q) => q.category !== undefined && cats.has(q.category));
    const q = pick(candidates, rng);
    if (!q) return null;
    const right = q.options[q.answer]!;
    return {
      mode: 'choice',
      kind: 'question',
      key: `question:${q.id}`,
      category: q.category,
      prompt: q.prompt,
      ...mixOptions(
        right,
        q.options.filter((_, i) => i !== q.answer),
        rng,
      ),
      explain: q.explain,
      example: verifiedView(q.example),
    };
  },
};
