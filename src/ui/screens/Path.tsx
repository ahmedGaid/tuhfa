/**
 * Course path (T041): one band per باب in the Sheikh's order; inside a ready باب, one row per وحدة
 * (category colour + icon) and a winding line of lesson nodes, a bigger chest node per checkpoint.
 * «قريبًا» chapters show only title + icon and never lock anything. Unlock rules: state/progress.ts.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { course } from '../../content/course.ts';
import type { ModuleRef, ParsedModule } from '../../content/schema.ts';
import { lessonStates, progress, type NodeState } from '../../state/progress.ts';
import { Badge } from '../components/ui.tsx';
import { num } from '../format.ts';
import { catStyle, lessonsOf, loadModule } from '../modules.ts';
import { href } from '../router.ts';
import { t } from '../strings.ar.ts';
import './Path.css';

/** sideways offset per node (× --wind-step), gives the path its gentle S-curve */
const WIND = [0, 1, 2, 1, 0, -1, -2, -1];

export function Path() {
  return (
    <div class="path">
      {course.modules.map((m) => (
        <ModuleBand key={m.id} mref={m} />
      ))}
    </div>
  );
}

function ModuleBand({ mref }: { mref: ModuleRef }) {
  const ready = mref.status === 'ready';
  const style = ready ? { '--cat': `light-dark(${mref.color.light}, ${mref.color.dark})` } : {};
  return (
    <section class={`band${ready ? '' : ' band--soon'}`} style={style} aria-labelledby={`band-${mref.id}`}>
      <header class="band__head">
        <span class="band__icon" aria-hidden="true">
          {mref.icon}
        </span>
        <h2 id={`band-${mref.id}`} class="band__title">
          {mref.title}
        </h2>
        {!ready && <span class="band__soon">{t.path.soon}</span>}
      </header>
      {ready && <ModuleNodes moduleId={mref.id} />}
    </section>
  );
}

function ModuleNodes({ moduleId }: { moduleId: string }) {
  const [module, setModule] = useState<ParsedModule | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    loadModule(moduleId)
      .then((m) => live && setModule(m))
      .catch(() => live && setModule(null));
    return () => {
      live = false;
    };
  }, [moduleId]);

  if (module === undefined)
    return (
      <p class="band__loading" aria-busy="true">
        {t.path.loading}
      </p>
    );
  if (!module) return null;

  const all = lessonsOf(module);
  const p = progress.value;
  const states = lessonStates(
    p,
    module.id,
    all.map((l) => l.id),
    p.settings.teacher,
  );
  let i = 0;

  return (
    <div class="units">
      {module.units.map((u) => {
        const cat = module.categories.find((c) => c.id === u.category);
        return (
          <section class="unit" key={u.id} style={catStyle(module, u.category)}>
            <h3 class="unit__title">
              <Badge icon={cat?.icon} text={u.title} />
            </h3>
            <ol class="nodes">
              {u.lessons.map((l) => {
                const n = i++;
                const state = states[n]!;
                const stars = p.lessons[`${module.id}/${l.id}`]?.stars ?? 0;
                return (
                  <li key={l.id} class="nodes__item" style={{ '--wind': String(WIND[n % WIND.length]) }}>
                    <Node
                      href={href('lesson', module.id, l.id)}
                      title={l.title}
                      kind={l.kind}
                      state={state}
                      stars={stars}
                      icon={cat?.icon}
                    />
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function Node({
  href: to,
  title,
  kind,
  state,
  stars,
  icon,
}: {
  href: string;
  title: string;
  kind: 'lesson' | 'checkpoint' | 'module-checkpoint';
  state: NodeState;
  stars: number;
  icon?: string | undefined;
}) {
  const big = kind !== 'lesson';
  const label = big ? (kind === 'checkpoint' ? t.path.checkpoint : t.path.moduleCheckpoint) : title;
  const face =
    state === 'locked' ? <LockIcon /> : big ? <ChestIcon open={state === 'done'} /> : <span>{icon}</span>;
  const cls = `node node--${state}${big ? ' node--big' : ''}`;
  // the open باب may sit below several «قريبًا» bands: bring the current lesson into view on arrival
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (state === 'current') ref.current?.scrollIntoView({ block: 'center' });
  }, []);
  const body = (
    <>
      {state === 'current' && (
        <span class="node__start" aria-hidden="true">
          {t.path.start}
        </span>
      )}
      <span class="node__dot" aria-hidden="true">
        {face}
      </span>
      <span class="node__title">{label}</span>
      <span class="visually-hidden">{t.path.state[state]}</span>
      {stars > 0 && (
        <span class="node__stars" role="img" aria-label={t.path.stars(num(stars))}>
          <span aria-hidden="true">{'★'.repeat(stars)}</span>
          <span aria-hidden="true" class="node__off">
            {'☆'.repeat(3 - stars)}
          </span>
        </span>
      )}
    </>
  );
  return state === 'locked' ? (
    <span class={cls} aria-disabled="true">
      {body}
    </span>
  ) : (
    <a ref={ref} class={cls} href={to} aria-current={state === 'current' ? 'step' : undefined}>
      {body}
    </a>
  );
}

// One icon hand: 24px, 2px stroke, round caps (ag-ui-standard rule 8).
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" class="node__icon">
      <path d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z" />
    </svg>
  );
}

function ChestIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" class="node__icon">
      {open ? (
        <path d="M3 12h18v8H3zM3 12l2-6h14l2 6M12 12v3" />
      ) : (
        <path d="M3 10a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v10H3zM3 12h18M12 11v4" />
      )}
    </svg>
  );
}
