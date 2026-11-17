/** One right option: «صنّف» · «المقدار» · «الحكم» · «كمّل التعريف» · «بنك الأسئلة» (T035). */
import { useState } from 'preact/hooks';
import type { ChoiceItem } from '../../engine/types.ts';
import { QuranText } from '../components/ui.tsx';
import { t } from '../strings.ar.ts';
import type { ExerciseProps } from './shared.tsx';

export function Choice({ item, locked, onAnswer }: ExerciseProps<ChoiceItem>) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <>
      {item.shown && (
        <div class="ex__shown">
          <QuranText example={item.shown} size="lg" />
        </div>
      )}
      {item.blank && (
        <p class="ex__fill">
          {item.blank.before}
          <span class="ex__blank">{locked ? item.options[item.answer] : t.ex.blank}</span>
          {item.blank.after}
        </p>
      )}
      <div class="ex__options">
        {item.options.map((o, i) => {
          const state = !locked
            ? ''
            : i === item.answer
              ? ' is-right'
              : i === picked
                ? ' is-wrong'
                : ' is-off';
          return (
            <button
              key={o}
              type="button"
              class={`opt${state}`}
              disabled={locked}
              onClick={() => {
                setPicked(i);
                onAnswer(i);
              }}
            >
              {locked && i === item.answer && <span aria-hidden="true">✔ </span>}
              {locked && i === picked && i !== item.answer && <span aria-hidden="true">✘ </span>}
              {o}
            </button>
          );
        })}
      </div>
    </>
  );
}
