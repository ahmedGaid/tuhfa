/** «المقدار» — how long is this concept held? */
import type { ChoiceItem, Generator } from '../types.ts';
import { distractors, feedbackExample, fillTemplate, mixOptions } from './util.ts';

export const amount: Generator = {
  kind: 'amount',
  build({ module, focus, pool }, rng): ChoiceItem | null {
    if (!focus) return null;
    const wrong = distractors(module, focus, pool, 3, (c) => c.amount, rng);
    if (!wrong.length) return null;
    return {
      mode: 'choice',
      kind: 'amount',
      key: `amount:${focus.id}`,
      concept: focus.id,
      category: focus.category,
      prompt: fillTemplate(module.prompts.amount, { name: focus.name }),
      ...mixOptions(
        focus.amount,
        wrong.map((c) => c.amount),
        rng,
      ),
      explain: `${focus.name}: ${focus.amount}`,
      example: feedbackExample(focus, rng),
    };
  },
};
