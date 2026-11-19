/** Lesson complete (T037, T044): «نقطة» celebrating, confetti, stars, accuracy, XP and a warm line. */
import type { LessonResult } from '../../engine/scoring.ts';
import { Confetti } from '../components/Confetti.tsx';
import { Mascot } from '../components/Mascot.tsx';
import { Button } from '../components/ui.tsx';
import { num, pct } from '../format.ts';
import { href } from '../router.ts';
import { t } from '../strings.ar.ts';
import './Complete.css';

export function Complete({
  title,
  kicker = t.complete.title,
  result,
  nextHref,
  homeHref = href('path'),
  homeLabel = t.complete.home,
  onAgain,
  seed,
}: {
  title: string;
  kicker?: string | undefined;
  homeHref?: string | undefined;
  homeLabel?: string | undefined;
  result: LessonResult;
  nextHref?: string | undefined;
  onAgain: () => void;
  seed: number;
}) {
  return (
    <section class="done" aria-labelledby="done-title">
      <Confetti />
      <Mascot pose="happy" size={112} />
      <p class="done__sub">
        {kicker} «{title}»
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
        <a class="btn btn--quiet" href={homeHref}>
          {homeLabel}
        </a>
      </div>
    </section>
  );
}
