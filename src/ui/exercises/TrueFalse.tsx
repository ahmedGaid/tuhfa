/** «صح ولا غلط» (T035). */
import { useState } from 'preact/hooks';
import type { TrueFalseItem } from '../../engine/types.ts';
import { QuranText } from '../components/ui.tsx';
import { t } from '../strings.ar.ts';
import type { ExerciseProps } from './shared.tsx';

export function TrueFalse({ item, locked, onAnswer }: ExerciseProps<TrueFalseItem>) {
  const [picked, setPicked] = useState<boolean | null>(null);
  const choices = [
    { v: true, icon: '✔', label: t.ex.true },
    { v: false, icon: '✘', label: t.ex.false },
  ];
  return (
    <>
      {item.shown && (
        <div class="ex__shown">
          <QuranText example={item.shown} size="lg" />
        </div>
      )}
      <div class="ex__tf">
        {choices.map(({ v, icon, label }) => {
          const state = !locked
            ? ''
            : v === item.answer
              ? ' is-right'
              : v === picked
                ? ' is-wrong'
                : ' is-off';
          return (
            <button
              key={label}
              type="button"
              class={`opt opt--tf${state}`}
              disabled={locked}
              onClick={() => {
                setPicked(v);
                onAnswer(v);
              }}
            >
              <span aria-hidden="true">{icon}</span> {label}
            </button>
          );
        })}
      </div>
    </>
  );
}
