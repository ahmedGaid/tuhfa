/**
 * Grading — pure functions. Single-step items are graded on the pick; step items (match, order,
 * spot, map) are checked tap by tap with the helpers below and graded on their mistake count.
 * Every Grade carries the item's example when a verified one exists (FR-008).
 */
import type { Answer, Grade, Item, MapItem, MatchItem, OrderItem, SpotItemView } from './types.ts';

function correctText(item: Item): string {
  switch (item.mode) {
    case 'choice':
      return item.options[item.answer] ?? '';
    case 'tf':
      return item.truth;
    case 'match':
      return item.pairs.map((p) => `${p.left}: ${p.right.label ?? p.right.quran}`).join(' · ');
    case 'order':
      return item.items.join(' ← ');
    case 'spot':
      return item.answer.map((i) => item.words[i]).join('، ');
    case 'map':
      return [...new Set(Object.values(item.fills))].join('، ');
  }
}

export function grade(item: Item, answer: Answer): Grade {
  let correct: boolean;
  if (item.mode === 'choice') correct = answer === item.answer;
  else if (item.mode === 'tf') correct = answer === item.answer;
  else correct = typeof answer === 'object' && answer.mistakes === 0;
  return { correct, correctAnswer: correctText(item), explain: item.explain, example: item.example };
}

/** «وصّل»: does right-column entry `right` belong to left entry `left`? */
export const pairFits = (_item: MatchItem, left: number, right: number): boolean => left === right;

/** «رتّب»: is chip `chip` (index into items) the next one after `placed` items? */
export const isNextInOrder = (_item: OrderItem, placed: number, chip: number): boolean => chip === placed;

/** «لوّن الحكم»: is word `index` one of the answers? */
export const isSpotHit = (item: SpotItemView, index: number): boolean => item.answer.includes(index);

/** «احفظ الخريطة»: does `word` belong in blank node `nodeId`? */
export const fitsBlank = (item: MapItem, nodeId: string, word: string): boolean =>
  item.fills[nodeId] === word;
