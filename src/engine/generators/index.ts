import type { Generator, ItemKind } from '../types.ts';
import { amount } from './amount.ts';
import { bank } from './bank.ts';
import { classify } from './classify.ts';
import { complete } from './complete.ts';
import { map } from './map.ts';
import { match } from './match.ts';
import { order } from './order.ts';
import { ruling } from './ruling.ts';
import { spot } from './spot.ts';
import { tfAmount, tfConcept } from './truefalse.ts';

/** Every exercise generator, by kind. */
export const generators: Record<ItemKind, Generator> = {
  classify,
  amount,
  ruling,
  'tf-amount': tfAmount,
  'tf-concept': tfConcept,
  fill: complete,
  match,
  order,
  spot,
  map,
  question: bank,
};
