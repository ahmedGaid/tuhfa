/** «رتّب» — tap the module's ranked items from first to last (e.g. strongest → weakest). */
import { shuffle } from '../rng.ts';
import type { Generator, OrderItem } from '../types.ts';
import { verifiedView } from './util.ts';

export const order: Generator = {
  kind: 'order',
  build({ module }, rng): OrderItem | null {
    const items = module.rank;
    if (!items || items.length < 2) return null;
    let chipOrder = shuffle(
      items.map((_, i) => i),
      rng,
    );
    // never hand out the answer already in order
    if (chipOrder.every((v, i) => v === i)) chipOrder = chipOrder.slice().reverse();
    const card = module.extras?.rankCard;
    return {
      mode: 'order',
      kind: 'order',
      key: `order:${chipOrder.join(',')}`,
      prompt: module.prompts.order,
      items: items.slice(),
      chipOrder,
      explain: card?.explain ?? items.join(' ← '),
      example: verifiedView(card?.example),
    };
  },
};
