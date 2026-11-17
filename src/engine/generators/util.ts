/** Shared helpers for generators. Generic: no topic, id or rule name lives here. */
import type { Concept, Example, ParsedModule, QuestionExample } from '../../content/schema.ts';
import { pick, shuffle, type Rng } from '../rng.ts';
import type { ExampleView } from '../types.ts';

/** Replace {name} {amount} … in a module prompt template. Unknown placeholders stay as they are. */
export function fillTemplate(template: string, vars: Record<string, string | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
}

export function toView(e: Example | QuestionExample): ExampleView {
  return { quran: e.quran, label: e.label, note: e.note, ref: e.ref };
}

/** A verified example's view, or undefined (unverified Quran text is never shown — FR-005). */
export function verifiedView(e: QuestionExample | undefined): ExampleView | undefined {
  return e?.verified ? toView(e) : undefined;
}

/** Verified examples of `c` that are tagged with it. */
export function ownExamples(c: Concept): Example[] {
  return c.examples.filter((e) => e.verified && e.tags.includes(c.id));
}

/** A random verified example of the concept for the feedback sheet. */
export function feedbackExample(c: Concept, rng: Rng): ExampleView | undefined {
  const e = pick(ownExamples(c), rng);
  return e && toView(e);
}

/**
 * Up to `k` other concepts whose `value` differs from the focus and from each other. Concepts in the
 * focus's distractorGroup come first (better wrong options), then the lesson pool, then the module.
 * `exclude` drops concepts that must not be offered (ambiguity: tags of the shown example).
 */
export function distractors(
  module: ParsedModule,
  focus: Concept,
  pool: Concept[],
  k: number,
  value: (c: Concept) => string,
  rng: Rng,
  exclude: ReadonlySet<string> = new Set(),
): Concept[] {
  const seen = new Set([value(focus)]);
  const ok = (c: Concept) => c.id !== focus.id && !exclude.has(c.id);
  const group = focus.distractorGroup
    ? module.concepts.filter((c) => ok(c) && c.distractorGroup === focus.distractorGroup)
    : [];
  const ordered = [
    ...shuffle(group, rng),
    ...shuffle(
      pool.filter((c) => ok(c)),
      rng,
    ),
    ...shuffle(module.concepts.filter(ok), rng),
  ];
  const out: Concept[] = [];
  for (const c of ordered) {
    const v = value(c);
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(c);
    if (out.length === k) break;
  }
  return out;
}

/** Shuffle the correct option in with the wrong ones; returns options + index of the right one. */
export function mixOptions(right: string, wrong: string[], rng: Rng): { options: string[]; answer: number } {
  const options = shuffle([right, ...wrong], rng);
  return { options, answer: options.indexOf(right) };
}
