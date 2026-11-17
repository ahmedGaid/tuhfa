/**
 * Content schema — the contract every module folder must satisfy (contracts/content-module.md).
 * Shapes follow specs/001-madd-v1/data-model.md. Pure data rules live here; checks that need the
 * Quran text (verify) or the engine (ambiguity) live in scripts/validate.ts.
 */
import { z } from 'zod';

const hex = z.string().regex(/^#[0-9a-f]{6}$/i, 'colour must be #rrggbb');
export const ColorPairSchema = z.object({ light: hex, dark: hex });

/** kebab-case or plain lowercase id */
const Id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'id must be lowercase kebab-case');

export const RefSchema = z
  .object({
    sura: z.number().int().min(1).max(114),
    aya: z.number().int().min(1),
    ayaTo: z.number().int().min(1).optional(),
  })
  .refine((r) => r.ayaTo === undefined || r.ayaTo > r.aya, 'ayaTo must be after aya');

/**
 * One Quranic example. `quran` is the pure Mushaf substring (Tanzil Uthmani) — the only part that
 * is verified. `label` is an optional display wrapper («اللام في «الٓمٓ»», «(وقفًا)»). Generators
 * show `label ?? quran`. Unverified examples are never shown in exercises (FR-005).
 */
export const ExampleSchema = z
  .object({
    quran: z.string().min(1),
    label: z.string().min(1).optional(),
    note: z.string(),
    ref: RefSchema.optional(),
    verified: z.boolean(),
    /** every concept id present in `quran` (ambiguity rule, research R6) */
    tags: z.array(Id).min(1),
  })
  .refine((e) => !e.verified || e.ref !== undefined, 'a verified example needs a ref');

/** Example attached to a question: same shape, but tags are not needed (no classify on it). */
export const QuestionExampleSchema = z
  .object({
    quran: z.string().min(1),
    label: z.string().min(1).optional(),
    note: z.string(),
    ref: RefSchema.optional(),
    verified: z.boolean(),
  })
  .refine((e) => !e.verified || e.ref !== undefined, 'a verified example needs a ref');

export const CategorySchema = z.object({
  id: Id,
  name: z.string().min(1),
  color: ColorPairSchema,
  icon: z.string().min(1).max(3),
});

export const ConceptSchema = z.object({
  id: Id,
  category: Id,
  name: z.string().min(1),
  rule: z.string().min(1),
  amount: z.string().min(1),
  ruling: z.string().min(1).optional(),
  examples: z.array(ExampleSchema).min(1),
  /** [before, blank, after] for «كمّل التعريف» — the blank is never empty */
  definition: z.tuple([z.string(), z.string().min(1), z.string()]),
  distractorGroup: z.string().optional(),
});

/** The 10 exercise types of the prototype (+ teach cards, which are not exercises). */
export const ExerciseTypeSchema = z.enum([
  'classify', // صنّف — which concept is in this example?
  'amount', // المقدار
  'ruling', // الحكم
  'tf-amount', // صح ولا غلط — amount
  'tf-concept', // صح ولا غلط — concept of an example
  'fill', // كمّل التعريف
  'match', // وصّل
  'order', // رتّب
  'spot', // لوّن الحكم
  'question', // fixed multiple-choice question from `questions`
]);

export const LessonSpecSchema = z.object({
  id: Id,
  title: z.string().min(1),
  newConcept: Id.optional(),
  practise: z.array(Id),
  kind: z.enum(['lesson', 'checkpoint', 'module-checkpoint']),
  types: z.array(ExerciseTypeSchema).min(1).optional(),
  size: z.number().int().min(10).max(15).default(12),
  libraryLesson: z.number().int().min(0).optional(),
  /** question topics (Question.topic) this lesson may draw fixed questions from */
  topics: z.array(z.string().min(1)).optional(),
  /** show the module's special teach card (e.g. rank card) before exercises */
  teachCard: z.enum(['rank']).optional(),
});

export const UnitSchema = z
  .object({
    id: Id,
    title: z.string().min(1),
    category: Id.optional(),
    lessons: z.array(LessonSpecSchema).min(1),
  })
  .refine((u) => u.lessons.at(-1)?.kind !== 'lesson', 'the last lesson of a unit must be a checkpoint');

/** Library text. `html` keeps Quran spans as <q-t>…</q-t> (sanitised at build). */
export const LessonSchema = z.object({
  title: z.string().min(1),
  tag: z.string().min(1).optional(),
  category: Id.optional(),
  html: z.string().min(1),
  pages: z.array(z.string().regex(/^[a-z0-9-]+$/)),
});

export const QuestionSchema = z
  .object({
    id: Id,
    prompt: z.string().min(1),
    options: z.array(z.string().min(1)).min(2).max(4),
    answer: z.number().int().min(0),
    /** question family as in the source (e.g. «أصلي», «مراتب», «الطرق») */
    topic: z.string().min(1),
    category: Id.optional(),
    explain: z.string().min(1),
    example: QuestionExampleSchema,
  })
  .refine((q) => q.answer < q.options.length, 'answer index out of range')
  .refine((q) => new Set(q.options).size === q.options.length, 'options must be unique');

export const SpotItemSchema = z
  .object({
    id: Id,
    unit: Id,
    concept: Id,
    /** what the learner taps, as shown in the prompt («مد العوض (لو وقفت آخر الآية)») */
    title: z.string().min(1),
    ayah: z.string().min(1),
    ref: RefSchema.optional(),
    verified: z.boolean(),
    /** 0-based indexes into spotWords(ayah) */
    answer: z.array(z.number().int().min(0)).min(1),
    note: z.string().min(1),
    /** the words the note names, in answer order — pins the indexes (research R7) */
    expectWords: z.array(z.string().min(1)).min(1),
  })
  .refine((s) => !s.verified || s.ref !== undefined, 'a verified spot ayah needs a ref')
  .refine((s) => s.expectWords.length === s.answer.length, 'one expectWord per answer index');

export interface TreeNode {
  t: string;
  /** Quran example shown under the name */
  e?: string | undefined;
  ref?: z.infer<typeof RefSchema> | undefined;
  verified?: boolean | undefined;
  /** short note shown in read mode */
  n?: string | undefined;
  c?: TreeNode[] | undefined;
  category?: string | undefined;
  /** top-level branch (bigger box) */
  major?: boolean | undefined;
  /** children stacked vertically */
  vertical?: boolean | undefined;
  /**
   * «احفظ الخريطة» levels that blank this node's name: 1 = structure, 2 = rule names.
   * Level 3 blanks every non-root node, level 4 blanks examples (`e`) — no flag needed.
   */
  hideAt?: (1 | 2)[] | undefined;
}

export const TreeNodeSchema: z.ZodType<TreeNode, TreeNode> = z.lazy(() =>
  z.object({
    t: z.string().min(1),
    e: z.string().min(1).optional(),
    ref: RefSchema.optional(),
    verified: z.boolean().optional(),
    n: z.string().min(1).optional(),
    c: z.array(TreeNodeSchema).min(1).optional(),
    category: Id.optional(),
    major: z.boolean().optional(),
    vertical: z.boolean().optional(),
    hideAt: z
      .array(z.union([z.literal(1), z.literal(2)]))
      .min(1)
      .optional(),
  }),
);

export const RulerRowSchema = z.object({
  label: z.string().min(1),
  fixed: z.number().int().min(0),
  optional: z.number().int().min(0),
  category: Id,
  tariq: z.enum(['ش', 'ط', 'both']),
});

export const TuruqRowSchema = z.object({
  name: z.string().min(1),
  shatibiyya: z.string().min(1),
  tayyiba: z.string().min(1),
  note: z.string().min(1),
});

/** Special teach card for «رتّب» (rank order). */
export const RankCardSchema = z.object({
  title: z.string().min(1),
  verse: z.string().min(1),
  body: z.string().min(1),
  facts: z.array(z.object({ label: z.string().min(1), text: z.string().min(1) })),
  /** explanation + example shown after a «رتّب» item */
  explain: z.string().min(1),
  example: QuestionExampleSchema,
});

export const ExtrasSchema = z.object({
  ruler: z.array(RulerRowSchema).optional(),
  turuq: z.array(TuruqRowSchema).optional(),
  rankCard: RankCardSchema.optional(),
});

/**
 * Module-specific prompt templates for generated exercises. Placeholders: {name} {amount}
 * {ruling} {title} {value}. The engine owns the mechanics; the module owns the wording
 * (constitution II: the engine knows no Tajweed topic).
 */
export const PromptsSchema = z.object({
  classify: z.string().min(1),
  amount: z.string().min(1),
  ruling: z.string().min(1),
  rulingExplain: z.string().min(1),
  tfAmount: z.string().min(1),
  tfConcept: z.string().min(1),
  fill: z.string().min(1),
  match: z.string().min(1),
  order: z.string().min(1),
  spot: z.string().min(1),
});

export const ModuleSchema = z
  .object({
    id: Id,
    title: z.string().min(1),
    /** closed list of rulings used by concepts and the «الحكم» exercise */
    rulings: z.array(z.string().min(1)).min(2).optional(),
    prompts: PromptsSchema,
    categories: z.array(CategorySchema).min(1).max(8),
    concepts: z.array(ConceptSchema).min(1),
    units: z.array(UnitSchema).min(1),
    lessons: z.array(LessonSchema),
    tree: TreeNodeSchema,
    questions: z.array(QuestionSchema).optional(),
    spot: z.array(SpotItemSchema).optional(),
    /** strongest → weakest, used by «رتّب» */
    rank: z.array(z.string().min(1)).min(2).optional(),
    extras: ExtrasSchema.optional(),
  })
  .superRefine((m, ctx) => {
    const issue = (message: string, path: (string | number)[]) =>
      ctx.addIssue({ code: 'custom', message, path });
    const dupes = (ids: string[], path: string) => {
      const seen = new Set<string>();
      for (const id of ids) {
        if (seen.has(id)) issue(`duplicate id "${id}"`, [path]);
        seen.add(id);
      }
      return seen;
    };
    const cats = dupes(
      m.categories.map((c) => c.id),
      'categories',
    );
    const concepts = dupes(
      m.concepts.map((c) => c.id),
      'concepts',
    );
    const units = dupes(
      m.units.map((u) => u.id),
      'units',
    );
    dupes(
      m.units.flatMap((u) => u.lessons.map((l) => l.id)),
      'units.lessons',
    );
    dupes(
      (m.questions ?? []).map((q) => q.id),
      'questions',
    );
    dupes(
      (m.spot ?? []).map((s) => s.id),
      'spot',
    );
    const topics = new Set((m.questions ?? []).map((q) => q.topic));

    m.concepts.forEach((c, i) => {
      if (!cats.has(c.category)) issue(`unknown category "${c.category}"`, ['concepts', i, 'category']);
      if (c.ruling && m.rulings && !m.rulings.includes(c.ruling))
        issue(`ruling "${c.ruling}" not in module.rulings`, ['concepts', i, 'ruling']);
      c.examples.forEach((e, j) =>
        e.tags.forEach((t) => {
          if (!concepts.has(t)) issue(`unknown tag "${t}"`, ['concepts', i, 'examples', j, 'tags']);
        }),
      );
      if (!c.examples.some((e) => e.tags.includes(c.id)))
        issue(`no example of "${c.id}" is tagged with it`, ['concepts', i, 'examples']);
    });
    m.units.forEach((u, i) => {
      if (u.category && !cats.has(u.category))
        issue(`unknown category "${u.category}"`, ['units', i, 'category']);
      u.lessons.forEach((l, j) => {
        const path = ['units', i, 'lessons', j];
        if (l.newConcept && !concepts.has(l.newConcept))
          issue(`unknown concept "${l.newConcept}"`, [...path, 'newConcept']);
        l.practise.forEach((p) => {
          if (!concepts.has(p)) issue(`unknown concept "${p}"`, [...path, 'practise']);
        });
        l.topics?.forEach((t) => {
          if (!topics.has(t)) issue(`no question has topic "${t}"`, [...path, 'topics']);
        });
        if (l.libraryLesson !== undefined && l.libraryLesson >= m.lessons.length)
          issue('libraryLesson out of range', [...path, 'libraryLesson']);
        if (l.teachCard === 'rank' && !m.extras?.rankCard)
          issue('rank teach card needs extras.rankCard', [...path, 'teachCard']);
      });
    });
    const last = m.units.at(-1)?.lessons.at(-1);
    if (last?.kind !== 'module-checkpoint') issue('the module must end with a module checkpoint', ['units']);
    m.lessons.forEach((l, i) => {
      if (l.category && !cats.has(l.category))
        issue(`unknown category "${l.category}"`, ['lessons', i, 'category']);
    });
    (m.questions ?? []).forEach((q, i) => {
      if (q.category && !cats.has(q.category))
        issue(`unknown category "${q.category}"`, ['questions', i, 'category']);
    });
    (m.spot ?? []).forEach((s, i) => {
      if (!units.has(s.unit)) issue(`unknown unit "${s.unit}"`, ['spot', i, 'unit']);
      if (!concepts.has(s.concept)) issue(`unknown concept "${s.concept}"`, ['spot', i, 'concept']);
    });
    (m.extras?.ruler ?? []).forEach((r, i) => {
      if (!cats.has(r.category))
        issue(`unknown category "${r.category}"`, ['extras', 'ruler', i, 'category']);
    });
    const walk = (n: TreeNode, path: (string | number)[]) => {
      if (n.category && !cats.has(n.category))
        issue(`unknown category "${n.category}"`, [...path, 'category']);
      if (n.verified && !n.ref) issue('a verified tree example needs a ref', path);
      n.c?.forEach((c, i) => walk(c, [...path, 'c', i]));
    };
    walk(m.tree, ['tree']);
  });

export type Ref = z.infer<typeof RefSchema>;
export type Example = z.infer<typeof ExampleSchema>;
export type QuestionExample = z.infer<typeof QuestionExampleSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Concept = z.infer<typeof ConceptSchema>;
export type ExerciseType = z.infer<typeof ExerciseTypeSchema>;
export type LessonSpec = z.input<typeof LessonSpecSchema>;
export type Unit = z.input<typeof UnitSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type SpotItem = z.infer<typeof SpotItemSchema>;
export type RulerRow = z.infer<typeof RulerRowSchema>;
export type TuruqRow = z.infer<typeof TuruqRowSchema>;
export type RankCard = z.infer<typeof RankCardSchema>;
export type Extras = z.infer<typeof ExtrasSchema>;
export type Prompts = z.infer<typeof PromptsSchema>;
/** What a module folder exports (input shape: defaults such as LessonSpec.size may be omitted). */
export type Module = z.input<typeof ModuleSchema>;
/** What the engine receives after parsing (defaults filled in). */
export type ParsedModule = z.output<typeof ModuleSchema>;

export const ModuleRefSchema = z.discriminatedUnion('status', [
  z.object({
    id: Id,
    title: z.string().min(1),
    icon: z.string().min(1).max(3),
    color: ColorPairSchema,
    status: z.literal('ready'),
    load: z.custom<() => Promise<{ default: Module }>>((v) => typeof v === 'function'),
  }),
  z.object({
    id: Id,
    title: z.string().min(1),
    icon: z.string().min(1).max(3),
    color: ColorPairSchema.optional(),
    status: z.literal('soon'),
  }),
]);
export type ModuleRef = z.infer<typeof ModuleRefSchema>;

export const CourseSchema = z
  .object({ modules: z.array(ModuleRefSchema).min(1) })
  .refine((c) => new Set(c.modules.map((m) => m.id)).size === c.modules.length, 'module ids must be unique');
export type Course = z.infer<typeof CourseSchema>;
