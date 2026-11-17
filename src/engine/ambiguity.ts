/**
 * Ambiguity rule (research R6). For «صنّف» / «صح ولا غلط» about concept X with answer options O,
 * an example is eligible only if it is verified, is tagged X, and carries no OTHER tag that is in O.
 * Otherwise a "wrong" option would also be right. Generic: knows nothing about any Tajweed topic.
 */
export interface Taggable {
  tags: string[];
  verified: boolean;
}

export function eligibleExamples<E extends Taggable>(examples: E[], target: string, options: string[]): E[] {
  return examples.filter(
    (e) => e.verified && e.tags.includes(target) && !e.tags.some((t) => t !== target && options.includes(t)),
  );
}

/** Is `target` the only option present in this example's tags? */
export function isUnambiguous(e: Taggable, target: string, options: string[]): boolean {
  return options.filter((o) => e.tags.includes(o)).length === 1 && e.tags.includes(target);
}
