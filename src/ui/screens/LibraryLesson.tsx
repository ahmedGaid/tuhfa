/**
 * One library lesson (T053): explanation (allow-listed html), family colour, the book pages behind
 * «📄 شوف الصفحة من الكتاب» (thumbnails → Lightbox), and previous / next. Route #/library/<module>/<n>.
 */
import { useState } from 'preact/hooks';
import { Mascot } from '../components/Mascot.tsx';
import { Lightbox } from '../components/Lightbox.tsx';
import { TreeView } from '../components/TreeView.tsx';
import { Badge } from '../components/ui.tsx';
import { num } from '../format.ts';
import { renderLibraryHtml } from '../libraryHtml.tsx';
import { catStyle, loadModule } from '../modules.ts';
import { href } from '../router.ts';
import { t } from '../strings.ar.ts';
import { useLoad } from '../useLoad.ts';
import './Library.css';

const pageSrc = (id: string) => `${import.meta.env.BASE_URL}book/${id}.jpg`;

export function LibraryLesson({ moduleId, n }: { moduleId: string; n: number }) {
  const module = useLoad(() => loadModule(moduleId), [moduleId]);
  const [pagesOpen, setPagesOpen] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);

  if (module === undefined)
    return (
      <p class="lib__state" aria-busy="true">
        {t.library.loading}
      </p>
    );
  const lesson = module?.lessons[n - 1];
  if (!module || !lesson)
    return (
      <section class="lib lib--state">
        <Mascot pose="think" size={64} />
        <p>{t.library.missing}</p>
        <a class="btn btn--primary" href={href('library')}>
          {t.library.back}
        </a>
      </section>
    );

  const cat = lesson.category ? module.categories.find((c) => c.id === lesson.category) : undefined;
  const pages = __BOOK_PAGES__ ? lesson.pages : [];
  const total = module.lessons.length;

  return (
    <article class="lib lib-lesson" style={catStyle(module, lesson.category)} aria-labelledby="lib-lesson-h">
      <a class="lib__back" href={href('library')}>
        → {t.library.back}
      </a>
      <header class="lib-lesson__head">
        <span class="lib__n">{num(n)}</span>
        <h1 id="lib-lesson-h">{lesson.title}</h1>
        {lesson.tag && <Badge icon={cat?.icon} text={lesson.tag} />}
      </header>

      {pages.length > 0 && (
        <div class="lib-pages">
          <button
            type="button"
            class="lib-pages__btn"
            aria-expanded={pagesOpen}
            aria-controls="lib-pages"
            onClick={() => setPagesOpen((o) => !o)}
          >
            {t.library.pages(pages.length, num(pages.length))}
          </button>
          {pagesOpen && (
            <div id="lib-pages" class="lib-pages__list">
              {pages.map((p, i) => (
                <button
                  key={p}
                  type="button"
                  class="lib-pages__thumb"
                  aria-label={t.library.pageAlt(num(i + 1))}
                  onClick={() => setViewing(p)}
                >
                  <img src={pageSrc(p)} alt="" loading="lazy" />
                </button>
              ))}
              <small>{t.library.pageTap}</small>
            </div>
          )}
        </div>
      )}

      <div class="lib-lesson__body">
        {renderLibraryHtml(lesson.html, { tree: () => <TreeView module={module} /> })}
      </div>

      <nav class="lib-lesson__nav" aria-label={t.library.lessons}>
        {n > 1 && (
          <a class="btn btn--alt" href={href('library', module.id, String(n - 1))}>
            {t.library.prev}
          </a>
        )}
        {n < total && (
          <a class="btn btn--primary" href={href('library', module.id, String(n + 1))}>
            {t.library.next}
          </a>
        )}
      </nav>

      {viewing && (
        <Lightbox
          src={pageSrc(viewing)}
          alt={t.library.pageAlt(num(pages.indexOf(viewing) + 1))}
          onClose={() => setViewing(null)}
        />
      )}
    </article>
  );
}
