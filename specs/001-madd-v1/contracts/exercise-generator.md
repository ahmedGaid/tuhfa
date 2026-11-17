# Contract: Exercise generators

```ts
type ExerciseType =
  | 'classify'   // صنّف
  | 'amount'     // المقدار
  | 'ruling'     // الحكم
  | 'truefalse'  // صح ولا غلط
  | 'complete'   // كمّل التعريف
  | 'match'      // وصّل
  | 'order'      // رتّب
  | 'spot'       // لوّن الحكم
  | 'map'        // احفظ الخريطة
  | 'bank';      // بنك الأسئلة

interface Generator<I extends Item> {
  type: ExerciseType;
  /** can this generator build an item for this concept pool from this module? */
  canBuild(ctx: GenContext): boolean;
  build(ctx: GenContext, rng: Rng): I | null;   // null = not enough verified data
  grade(item: I, answer: AnswerOf<I>): Grade;
}

interface GenContext { module: Module; focus: Concept; pool: Concept[]; level?: 1|2|3|4 }
interface Grade { correct: boolean; correctAnswer: string; explain: string;
                  example: { quran: string; label?: string; note: string } }
```

## Rules
- Generators read only `GenContext`; no module ids, concept ids or Arabic rule names in engine code.
- Only `verified:true` examples are ever selected.
- Options: correct + up to 3 distractors, preferring the same `distractorGroup`, shuffled with the
  seeded `Rng`; never an option that is also in the chosen example's `tags`.
- `grade` is pure; every Grade carries an example (FR-008).
- Session builder: teach card if `newConcept` and not seen; then `size` items with a type mix
  (default weights; `map` max 1 per lesson; `bank` only if questions exist for the pool); wrong items
  re-queued at +3..+5 positions, max 2 extra times.
