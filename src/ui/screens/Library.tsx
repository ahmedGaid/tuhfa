/**
 * «المكتبة» tab (T053, T055, US5): each باب with its lessons, the harakat ruler and the tariq table;
 * «قريبًا» chapters by title only; «انضم للقناة» opens the Telegram invite outside the app.
 */
import { course } from '../../content/course.ts';
import type { ParsedModule } from '../../content/schema.ts';
import { Badge } from '../components/ui.tsx';
import { Ruler, TuruqTable } from '../components/Ruler.tsx';
import { num } from '../format.ts';
import { catStyle, loadReadyModules } from '../modules.ts';
import { href } from '../router.ts';
import { t } from '../strings.ar.ts';
import { useLoad } from '../useLoad.ts';
import './Library.css';

export function ChannelButton() {
  if (!course.channel) return null;
  return (
    <a class="btn btn--alt channel" href={course.channel} target="_blank" rel="noopener noreferrer">
      <span>{t.library.channel}</span>
      <small>{t.library.channelHint}</small>
    </a>
  );
}

export function Library() {
  const mods = useLoad(loadReadyModules, []);
  return (
    <section class="lib">
      <h1 class="lib__title">{t.library.title}</h1>
      <ChannelButton />
      {mods === undefined ? (
        <p class="lib__state" aria-busy="true">
          {t.library.loading}
        </p>
      ) : (
        <>
          {/* readable chapters first (course order), «قريبًا» ones after them */}
          {(mods ?? []).map((m) => (
            <ModuleShelf key={m.id} module={m} />
          ))}
          {course.modules
            .filter((ref) => !mods?.some((m) => m.id === ref.id))
            .map((ref) => (
              <section key={ref.id} class="lib__soon" aria-label={ref.title}>
                <span class="lib__soon-icon" aria-hidden="true">
                  {ref.icon}
                </span>
                <span>{ref.title}</span>
                <small>{t.library.soon}</small>
              </section>
            ))}
        </>
      )}
    </section>
  );
}

function ModuleShelf({ module }: { module: ParsedModule }) {
  const ref = course.modules.find((m) => m.id === module.id);
  return (
    <section class="lib__mod" aria-labelledby={`lib-${module.id}`}>
      <h2 id={`lib-${module.id}`} class="lib__mod-title">
        <span aria-hidden="true">{ref?.icon}</span> {module.title}
      </h2>
      <h3 class="lib__h">
        {t.library.lessons} · {t.library.lessonCount(num(module.lessons.length))}
      </h3>
      <ol class="lib__list">
        {module.lessons.map((l, i) => {
          const cat = l.category ? module.categories.find((c) => c.id === l.category) : undefined;
          return (
            <li key={i}>
              <a
                class="lib__item"
                href={href('library', module.id, String(i + 1))}
                style={catStyle(module, l.category)}
              >
                <span class="lib__n">{num(i + 1)}</span>
                <span class="lib__name">{l.title}</span>
                {l.tag && <Badge icon={cat?.icon} text={l.tag} />}
              </a>
            </li>
          );
        })}
      </ol>
      {module.extras?.ruler && <Ruler module={module} rows={module.extras.ruler} />}
      {module.extras?.turuq && <TuruqTable rows={module.extras.turuq} />}
    </section>
  );
}
