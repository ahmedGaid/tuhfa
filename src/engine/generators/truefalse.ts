/** «صح ولا غلط» — two flavours: a claim about the amount, or about the concept in a Quran word. */
import { isUnambiguous } from '../ambiguity.ts';
import { pick } from '../rng.ts';
import type { Generator, TrueFalseItem } from '../types.ts';
import { distractors, feedbackExample, fillTemplate, ownExamples, toView } from './util.ts';

export const tfAmount: Generator = {
  kind: 'tf-amount',
  build({ module, focus, pool }, rng): TrueFalseItem | null {
    if (!focus) return null;
    const truth = fillTemplate(module.prompts.tfAmount, { name: focus.name, value: focus.amount });
    const isTrue = rng() < 0.5;
    let value = focus.amount;
    if (!isTrue) {
      const other = distractors(module, focus, pool, 1, (c) => c.amount, rng)[0];
      if (!other) return null;
      value = other.amount;
    }
    return {
      mode: 'tf',
      kind: 'tf-amount',
      key: `tf-amount:${focus.id}:${value}`,
      concept: focus.id,
      category: focus.category,
      prompt: fillTemplate(module.prompts.tfAmount, { name: focus.name, value }),
      answer: isTrue,
      truth,
      explain: `${focus.name}: ${focus.amount}`,
      example: feedbackExample(focus, rng),
    };
  },
};

export const tfConcept: Generator = {
  kind: 'tf-concept',
  build({ module, focus, pool }, rng): TrueFalseItem | null {
    if (!focus) return null;
    const e = pick(ownExamples(focus), rng);
    if (!e) return null;
    const isTrue = rng() < 0.5;
    let claimed = focus;
    if (!isTrue) {
      // the false claim must not be another concept that is also in this word
      const other = distractors(module, focus, pool, 1, (c) => c.name, rng, new Set(e.tags))[0];
      if (!other) return null;
      claimed = other;
    }
    if (!isUnambiguous(e, focus.id, [focus.id, claimed.id])) return null;
    const view = toView(e);
    return {
      mode: 'tf',
      kind: 'tf-concept',
      key: `tf-concept:${focus.id}:${e.quran}:${claimed.id}`,
      concept: focus.id,
      category: focus.category,
      prompt: fillTemplate(module.prompts.tfConcept, { name: focus.name, value: claimed.name }),
      shown: view,
      answer: isTrue,
      truth: fillTemplate(module.prompts.tfConcept, { name: focus.name, value: focus.name }),
      explain: `${focus.name}: ${focus.rule}`,
      example: view,
    };
  },
};
