/** «وصّل» — pick a name, then its example (either side first). Wrong pairs only shake (T036). */
import { useState } from 'preact/hooks';
import { pairFits } from '../../engine/grade.ts';
import type { MatchItem } from '../../engine/types.ts';
import { catStyle } from '../modules.ts';
import { t } from '../strings.ar.ts';
import { shakeClass, useShake, type ExerciseProps } from './shared.tsx';

export function Match({ module, item, locked, onAnswer }: ExerciseProps<MatchItem>) {
  const [left, setLeft] = useState<number | null>(null);
  const [right, setRight] = useState<number | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [shaking, shake] = useShake();

  const tryPair = (l: number | null, r: number | null) => {
    if (l === null || r === null) return;
    if (pairFits(item, l, r)) {
      const next = new Set(done).add(l);
      setDone(next);
      if (next.size === item.pairs.length) onAnswer({ mistakes });
    } else {
      setMistakes((m) => m + 1);
      shake(`r${r}`);
      shake(`l${l}`);
    }
    setLeft(null);
    setRight(null);
  };

  return (
    <>
      <p class="ex__hint">{t.ex.matchHint}</p>
      <div class="match">
        <div class="match__col">
          {item.pairs.map((p, i) => (
            <button
              key={p.left}
              type="button"
              class={`opt opt--cat${left === i ? ' is-on' : ''}${done.has(i) ? ' is-done' : ''}${shakeClass(shaking, `l${i}`)}`}
              style={catStyle(module, p.category)}
              disabled={locked || done.has(i)}
              aria-pressed={left === i}
              onClick={() => {
                setLeft(i);
                tryPair(i, right);
              }}
            >
              {p.left}
            </button>
          ))}
        </div>
        <div class="match__col">
          {item.rightOrder.map((i) => {
            const p = item.pairs[i]!;
            return (
              <button
                key={p.right.quran}
                type="button"
                class={`opt opt--quran${right === i ? ' is-on' : ''}${done.has(i) ? ' is-done' : ''}${shakeClass(shaking, `r${i}`)}`}
                disabled={locked || done.has(i)}
                aria-pressed={right === i}
                onClick={() => {
                  setRight(i);
                  tryPair(left, i);
                }}
              >
                <span class="quran">{p.right.label ?? p.right.quran}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
