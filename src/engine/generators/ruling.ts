/** «الحكم» — the concept's ruling, from the module's closed list of rulings. */
import { shuffle } from '../rng.ts';
import type { ChoiceItem, Generator } from '../types.ts';
import { feedbackExample, fillTemplate } from './util.ts';

export const ruling: Generator = {
  kind: 'ruling',
  build({ module, focus }, rng): ChoiceItem | null {
    const rulings = module.rulings;
    if (!focus?.ruling || !rulings || !rulings.includes(focus.ruling)) return null;
    // keep the module's order (it is a small fixed scale), as the prototype does
    const options = rulings.length > 4 ? shuffle(rulings, rng).slice(0, 4) : rulings.slice();
    if (!options.includes(focus.ruling)) options[0] = focus.ruling;
    return {
      mode: 'choice',
      kind: 'ruling',
      key: `ruling:${focus.id}`,
      concept: focus.id,
      category: focus.category,
      prompt: fillTemplate(module.prompts.ruling, { name: focus.name }),
      options,
      answer: options.indexOf(focus.ruling),
      explain: `${focus.name}: ${focus.ruling}. ${module.prompts.rulingExplain}`,
      example: feedbackExample(focus, rng),
    };
  },
};
