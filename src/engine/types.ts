/**
 * Engine types (contracts/exercise-generator.md). The engine is generic: it reads a parsed module
 * and knows no Tajweed topic, no module id and no rule name (constitution II). All learner-facing
 * wording comes from the module (`prompts`, concept fields) or from the UI strings file.
 */
import type { Concept, ParsedModule, Ref } from '../content/schema.ts';
import type { Rng } from './rng.ts';

export type ItemKind =
  | 'classify' // صنّف
  | 'amount' // المقدار
  | 'ruling' // الحكم
  | 'tf-amount' // صح ولا غلط — amount
  | 'tf-concept' // صح ولا غلط — concept of an example
  | 'fill' // كمّل التعريف
  | 'match' // وصّل
  | 'order' // رتّب
  | 'spot' // لوّن الحكم
  | 'map' // احفظ الخريطة
  | 'question'; // بنك الأسئلة

export type MapLevel = 1 | 2 | 3 | 4;

/** A verified Quran example as shown to the learner (`label ?? quran`). */
export interface ExampleView {
  quran: string;
  label?: string | undefined;
  note: string;
  ref?: Ref | undefined;
}

interface ItemBase {
  /** dedupe key inside one session (same key = same question) */
  key: string;
  kind: ItemKind;
  /** concept this item practises (absent for module-wide items such as «رتّب») */
  concept?: string | undefined;
  /** category id for the colour band */
  category?: string | undefined;
  prompt: string;
  explain: string;
  /** feedback example — only ever a verified one; absent when none is verified yet */
  example?: ExampleView | undefined;
}

/** One right option among 2–4 (classify, amount, ruling, fill, question). */
export interface ChoiceItem extends ItemBase {
  mode: 'choice';
  options: string[];
  answer: number;
  /** the Quran word under the prompt (classify) */
  shown?: ExampleView | undefined;
  /** «كمّل التعريف»: text around the blank */
  blank?: { before: string; after: string } | undefined;
}

export interface TrueFalseItem extends ItemBase {
  mode: 'tf';
  answer: boolean;
  /** the true statement, shown as the correct answer */
  truth: string;
  shown?: ExampleView | undefined;
}

export interface MatchItem extends ItemBase {
  mode: 'match';
  /** left = concept name, right = its example; pair i belongs together */
  pairs: { left: string; right: ExampleView; category?: string | undefined }[];
  /** display order of the right column (indexes into pairs) */
  rightOrder: number[];
}

export interface OrderItem extends ItemBase {
  mode: 'order';
  /** the correct order */
  items: string[];
  /** display order of the chips (indexes into items) */
  chipOrder: number[];
}

export interface SpotItemView extends ItemBase {
  mode: 'spot';
  words: string[];
  /** 0-based indexes into words */
  answer: number[];
  ref?: Ref | undefined;
}

export interface MapNode {
  id: string;
  depth: number;
  text: string;
  /** verified example only */
  quran?: string | undefined;
  category?: string | undefined;
  /** level 4 blanks the example, other levels the name */
  blank: boolean;
}

export interface MapItem extends ItemBase {
  mode: 'map';
  level: MapLevel;
  nodes: MapNode[];
  /** the expected word for every blank node id */
  fills: Record<string, string>;
  /** word bank: each distinct expected word once, shuffled */
  bank: string[];
}

export type Item = ChoiceItem | TrueFalseItem | MatchItem | OrderItem | SpotItemView | MapItem;

/**
 * Answers. Single-step items take the pick; step items (match, order, spot, map) are checked tap by
 * tap in the UI against the item's own data and graded at the end by their mistake count.
 */
export type Answer = number | boolean | { mistakes: number };

export interface Grade {
  correct: boolean;
  correctAnswer: string;
  explain: string;
  example?: ExampleView | undefined;
}

export interface GenContext {
  module: ParsedModule;
  /** the concept this item is about (absent in module-wide lessons) */
  focus?: Concept | undefined;
  /** concepts of the lesson */
  pool: Concept[];
  /** «احفظ الخريطة» level */
  level?: MapLevel | undefined;
  /** question topics the lesson may draw from */
  topics?: string[] | undefined;
  /** how many map blanks at most */
  mapBlanks?: number | undefined;
}

export interface Generator {
  kind: ItemKind;
  /** null = not enough verified data for this context */
  build(ctx: GenContext, rng: Rng): Item | null;
}
