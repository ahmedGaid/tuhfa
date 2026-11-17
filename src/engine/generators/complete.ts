/** «كمّل التعريف» — pick the missing word of the concept's definition. */
import type { ChoiceItem, Generator } from '../types.ts';
import { distractors, feedbackExample, fillTemplate, mixOptions } from './util.ts';

export const complete: Generator = {
  kind: 'fill',
  build({ module, focus, pool }, rng): ChoiceItem | null {
    if (!focus) return null;
    const [before, blank, after] = focus.definition;
    const wrong = distractors(module, focus, pool, 3, (c) => c.definition[1], rng);
    if (!wrong.length) return null;
    return {
      mode: 'choice',
      kind: 'fill',
      key: `fill:${focus.id}`,
      concept: focus.id,
      category: focus.category,
      prompt: fillTemplate(module.prompts.fill, { name: focus.name }),
      blank: { before, after },
      ...mixOptions(
        blank,
        wrong.map((c) => c.definition[1]),
        rng,
      ),
      explain: `${focus.name}: ${focus.rule}`,
      example: feedbackExample(focus, rng),
    };
  },
};
