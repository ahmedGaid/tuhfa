/**
 * Review session (T050): #/practice/<mistakes|due>[/<seed>]. Takes the module that owns the top
 * review key and plays its concepts with the shared lesson player; the result goes to the Leitner
 * boxes and the mistakes list (applyReview), never to lesson stars.
 */
import type { ParsedModule } from '../../content/schema.ts';
import { buildReview } from '../../engine/srs.ts';
import { today } from '../../state/date.ts';
import { completeReview, progress } from '../../state/progress.ts';
import { conceptsOf, firstModule, reviewKeys, type ReviewMode } from '../../state/review.ts';
import { Mascot } from '../components/Mascot.tsx';
import { loadReadyModules } from '../modules.ts';
import { href } from '../router.ts';
import { t } from '../strings.ar.ts';
import { useLoad } from '../useLoad.ts';
import { Play } from './Lesson.tsx';

/** Keys of `mode` that belong to a loaded module's concepts. */
function targets(mods: ParsedModule[], mode: ReviewMode) {
  const known = new Set(mods.flatMap((m) => m.concepts.map((c) => `${m.id}/${c.id}`)));
  const keys = reviewKeys(progress.peek(), mode, today()).filter((k) => known.has(k));
  const module = mods.find((m) => m.id === firstModule(keys)) ?? mods[0];
  return { module, ids: module ? conceptsOf(keys, module.id) : [] };
}

export function Practice({ mode, seed }: { mode: ReviewMode; seed?: number | undefined }) {
  const mods = useLoad(loadReadyModules, []);
  if (mods === undefined)
    return (
      <div class="lesson lesson--state" aria-busy="true">
        <Mascot pose="think" size={64} />
        <p>{t.review.loading}</p>
      </div>
    );
  const { module } = targets(mods ?? [], mode);
  if (!module)
    return (
      <div class="lesson lesson--state">
        <Mascot pose="think" size={64} />
        <p>{t.review.empty}</p>
        <a class="btn btn--primary" href={href('review')}>
          {t.review.back}
        </a>
      </div>
    );

  return (
    <Play
      key={`${mode}/${seed ?? ''}`}
      module={module}
      seed={seed}
      // read the keys on every run: «عيد» after a review sees the updated boxes and mistakes
      build={(rng) => buildReview(module, targets([module], mode).ids, rng)}
      onFinish={(r, s) => completeReview({ moduleId: module.id, xp: r.xp, right: s.right, wrong: s.wrong })}
      done={{
        title: t.review.sessionTitle[mode],
        kicker: t.review.kicker,
        homeHref: href('review'),
        homeLabel: t.review.back,
      }}
      exitHref={href('review')}
      emptyText={t.review.empty}
    />
  );
}
