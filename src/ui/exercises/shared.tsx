import { useState } from 'preact/hooks';
import type { ParsedModule } from '../../content/schema.ts';
import type { Answer, Item } from '../../engine/types.ts';

export interface ExerciseProps<I extends Item> {
  module: ParsedModule;
  item: I;
  /** true once answered: the view shows the result and takes no more input */
  locked: boolean;
  onAnswer: (answer: Answer) => void;
}

/** A wrong tap shakes the element (key = which one); reduced motion turns the animation off. */
export function useShake(): [string | null, (key: string) => void] {
  const [state, set] = useState<{ key: string; n: number } | null>(null);
  const trigger = (key: string) => set((s) => ({ key, n: (s?.n ?? 0) + 1 }));
  return [state ? `${state.key}#${state.n}` : null, trigger];
}

export const shakeClass = (shaking: string | null, key: string) =>
  shaking?.startsWith(`${key}#`) ? ' shake' : '';
