/** Lesson complete (T037): «نقطة» celebrating, stars, accuracy, XP and a warm line. */
import type { LessonResult } from '../../engine/scoring.ts';
import { Mascot } from '../components/Mascot.tsx';
import { Button } from '../components/ui.tsx';
import { num, pct } from '../format.ts';
import { href } from '../router.ts';
import { t } from '../strings.ar.ts';
import './Complete.css';

export function Complete({
  title,
  result,
  nextHref,
  onAgain,
  seed,
}: {
  title: string;
  result: LessonResult;
  nextHref?: string | undefined;
  onAgain: () => void;
  seed: number;
}) {
  return (
    <section class="done" aria-labelledby="done-title">
      <Mascot pose="happy" size={112} />
      <p class="done__sub">
        {t.complete.title} «{title}»
      </p>
      <h1 id="done-title" class="done__warm">
        {t.complete.warm[seed % t.complete.warm.length]}
      </h1>
      <p class="done__stars" role="img" aria-label={t.complete.stars(num(result.stars))}>
        <span>{'★'.repeat(result.stars)}</span>
        <span class="done__off">{'☆'.repeat(3 - result.stars)}</span>
      </p>
      <dl class="done__facts">
        <div>
          <dt>{t.complete.accuracy}</dt>
          <dd>{pct(result.accuracy)}</dd>
        </div>
        <div>
          <dt>{t.complete.xp}</dt>
          <dd>⭐ {num(result.xp)}</dd>
        </div>
      </dl>
      {result.perfect && <p class="done__perfect">{t.complete.perfect}</p>}
      <div class="done__actions">
        {nextHref && (
          <a class="btn btn--primary" href={nextHref}>
            {t.complete.next}
          </a>
        )}
        <Button variant="alt" onClick={onAgain}>
          {t.complete.again}
        </Button>
        <a class="btn btn--quiet" href={href('path')}>
          {t.complete.home}
        </a>
      </div>
    </section>
  );
}
