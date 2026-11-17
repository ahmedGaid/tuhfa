/** «رتّب» — tap the items from first to last (T036). */
import { useState } from 'preact/hooks';
import { isNextInOrder } from '../../engine/grade.ts';
import type { OrderItem } from '../../engine/types.ts';
import { num } from '../format.ts';
import { t } from '../strings.ar.ts';
import { shakeClass, useShake, type ExerciseProps } from './shared.tsx';

export function Order({ item, locked, onAnswer }: ExerciseProps<OrderItem>) {
  const [placed, setPlaced] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [shaking, shake] = useShake();

  const tap = (chip: number) => {
    if (isNextInOrder(item, placed.length, chip)) {
      const next = [...placed, chip];
      setPlaced(next);
      if (next.length === item.items.length) onAnswer({ mistakes });
    } else {
      setMistakes((m) => m + 1);
      shake(`c${chip}`);
    }
  };

  return (
    <>
      <p class="ex__hint">{t.ex.orderHint}</p>
      <ol class="order__placed" aria-label={t.ex.placed}>
        {placed.map((i, n) => (
          <li key={i}>
            <span class="order__n">{num(n + 1)}</span>
            {item.items[i]}
          </li>
        ))}
      </ol>
      <div class="ex__chips">
        {item.chipOrder
          .filter((i) => !placed.includes(i))
          .map((i) => (
            <button
              key={i}
              type="button"
              class={`opt opt--chip${shakeClass(shaking, `c${i}`)}`}
              disabled={locked}
              onClick={() => tap(i)}
            >
              {item.items[i]}
            </button>
          ))}
      </div>
    </>
  );
}
