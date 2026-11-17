/** «صنّف» — which concept is in this Quran word? (ambiguity rule R6: no option is also in its tags) */
import { isUnambiguous } from '../ambiguity.ts';
import { pick } from '../rng.ts';
import type { ChoiceItem, Generator } from '../types.ts';
import { distractors, mixOptions, ownExamples, toView } from './util.ts';

export const classify: Generator = {
  kind: 'classify',
  build({ module, focus, pool }, rng): ChoiceItem | null {
    if (!focus) return null;
    const e = pick(ownExamples(focus), rng);
    if (!e) return null;
    const wrong = distractors(module, focus, pool, 3, (c) => c.name, rng, new Set(e.tags));
    if (!wrong.length) return null;
    const optionIds = [focus.id, ...wrong.map((c) => c.id)];
    if (!isUnambiguous(e, focus.id, optionIds)) return null;
    const view = toView(e);
    return {
      mode: 'choice',
      kind: 'classify',
      key: `classify:${focus.id}:${e.quran}`,
      concept: focus.id,
      category: focus.category,
      prompt: module.prompts.classify,
      shown: view,
      ...mixOptions(
        focus.name,
        wrong.map((c) => c.name),
        rng,
      ),
      explain: `${focus.name}: ${focus.rule}`,
      example: view,
    };
  },
};
