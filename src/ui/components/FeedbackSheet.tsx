/**
 * Feedback after every answer (T034, FR-008): right/wrong in word + icon (never colour alone), the
 * correct answer, a short why, and a verified Quran example when one exists. The Lesson screen
 * mirrors the headline into its live region for screen readers.
 */
import { useEffect, useRef } from 'preact/hooks';
import type { Grade } from '../../engine/types.ts';
import { num } from '../format.ts';
import { t } from '../strings.ar.ts';
import { QuranText, Sheet } from './ui.tsx';
import './FeedbackSheet.css';

export function feedbackHeadline(g: Grade, mistakes: number, seed: number): string {
  if (g.correct) return t.feedback.right[seed % t.feedback.right.length]!;
  return mistakes > 0 ? t.feedback.slips(num(mistakes)) : t.feedback.wrong;
}

export function FeedbackSheet({
  grade,
  headline,
  returns,
  onNext,
}: {
  grade: Grade;
  headline: string;
  returns: boolean;
  onNext: () => void;
}) {
  const next = useRef<HTMLButtonElement>(null);
  useEffect(() => next.current?.focus(), []);
  const ok = grade.correct;
  return (
    <Sheet tone={ok ? 'ok' : 'bad'} label={headline}>
      <p class={`fb__head fb__head--${ok ? 'ok' : 'bad'}`}>
        <span aria-hidden="true">{ok ? '✔' : '✘'}</span> {headline}
        {ok && <span class="fb__xp">{t.feedback.xp}</span>}
      </p>
      {!ok && grade.correctAnswer && (
        <p class="fb__answer">
          <b>{t.feedback.correctAnswer}: </b>
          {grade.correctAnswer}
        </p>
      )}
      {grade.explain && <p class="fb__explain">{grade.explain}</p>}
      {grade.example && (
        <figure class="fb__example">
          <figcaption>{t.feedback.example}</figcaption>
          <QuranText example={grade.example} />
          <p>{grade.example.note}</p>
        </figure>
      )}
      {!ok && returns && <p class="fb__returns">{t.feedback.returns}</p>}
      <button ref={next} type="button" class="btn btn--primary fb__next" onClick={onNext}>
        {t.feedback.next}
      </button>
    </Sheet>
  );
}
