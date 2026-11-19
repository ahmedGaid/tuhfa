/**
 * «راجع» tab (T050, US4): «راجع غلطاتي» (concepts answered wrong) and «تمرين اليوم» (concepts due by
 * Leitner). Nothing to do → a friendly empty state that points back to the path.
 */
import { today } from '../../state/date.ts';
import { progress } from '../../state/progress.ts';
import { reviewKeys, type ReviewMode } from '../../state/review.ts';
import { Mascot } from '../components/Mascot.tsx';
import { num } from '../format.ts';
import { loadReadyModules } from '../modules.ts';
import { href } from '../router.ts';
import { t } from '../strings.ar.ts';
import { useLoad } from '../useLoad.ts';
import './Review.css';

export function Review() {
  const mods = useLoad(loadReadyModules, []);
  if (mods === undefined)
    return (
      <section class="review review--state" aria-busy="true">
        <p>{t.review.loading}</p>
      </section>
    );

  const known = new Set((mods ?? []).flatMap((m) => m.concepts.map((c) => `${m.id}/${c.id}`)));
  const day = today();
  const count = (mode: ReviewMode) =>
    reviewKeys(progress.value, mode, day).filter((k) => known.has(k)).length;
  const mistakes = count('mistakes');
  const due = count('due');

  if (!mistakes && !due)
    return (
      <section class="review review--state">
        <Mascot pose="happy" size={88} />
        <h1>{t.review.emptyTitle}</h1>
        <p>{t.review.emptyBody}</p>
        <a class="btn btn--primary" href={href('path')}>
          {t.review.toPath}
        </a>
      </section>
    );

  return (
    <section class="review">
      <h1 class="review__title">{t.review.title}</h1>
      <Card
        mode="mistakes"
        title={t.review.mistakes}
        body={mistakes ? t.review.mistakesBody(num(mistakes)) : t.review.noneMistakes}
        n={mistakes}
      />
      <Card
        mode="due"
        title={t.review.due}
        body={due ? t.review.dueBody(num(due)) : t.review.noneDue}
        n={due}
      />
    </section>
  );
}

function Card({ mode, title, body, n }: { mode: ReviewMode; title: string; body: string; n: number }) {
  return (
    <article class="review__card" aria-labelledby={`rv-${mode}`}>
      <div>
        <h2 id={`rv-${mode}`}>{title}</h2>
        <p>{body}</p>
      </div>
      {n > 0 && (
        <a class="btn btn--primary" href={href('practice', mode)} aria-describedby={`rv-${mode}`}>
          {t.review.start}
        </a>
      )}
    </article>
  );
}
