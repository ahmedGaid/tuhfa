/** «لوّن الحكم» — tap every word of the ayah that holds the rule (T036). */
import { useState } from 'preact/hooks';
import { isSpotHit } from '../../engine/grade.ts';
import type { SpotItemView } from '../../engine/types.ts';
import { num } from '../format.ts';
import { t } from '../strings.ar.ts';
import { shakeClass, useShake, type ExerciseProps } from './shared.tsx';

export function Spot({ item, locked, onAnswer }: ExerciseProps<SpotItemView>) {
  const [found, setFound] = useState<Set<number>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [shaking, shake] = useShake();

  const tap = (i: number) => {
    if (found.has(i)) return;
    if (isSpotHit(item, i)) {
      const next = new Set(found).add(i);
      setFound(next);
      if (next.size === item.answer.length) onAnswer({ mistakes });
    } else {
      setMistakes((m) => m + 1);
      shake(`w${i}`);
    }
  };

  return (
    <>
      <p class="spot quran" lang="ar">
        <span aria-hidden="true">﴿ </span>
        {item.words.map((w, i) => (
          <button
            key={i}
            type="button"
            class={`spot__w${found.has(i) || (locked && item.answer.includes(i)) ? ' is-hit' : ''}${shakeClass(shaking, `w${i}`)}`}
            disabled={locked}
            aria-pressed={found.has(i)}
            onClick={() => tap(i)}
          >
            {w}
          </button>
        ))}
        <span aria-hidden="true"> ﴾</span>
      </p>
      <p class="ex__hint">{t.ex.spotCount(item.answer.length, num(item.answer.length))}</p>
    </>
  );
}
