import { route, href } from './router';
import { t } from './strings.ar';
import { TabBar } from './components/TabBar';
import { HeaderStats } from './components/HeaderStats';
import { About } from './screens/About';
import { Lesson } from './screens/Lesson';
import { Library } from './screens/Library';
import { LibraryLesson } from './screens/LibraryLesson';
import { Path } from './screens/Path';
import { Practice } from './screens/Practice';
import { Profile } from './screens/Profile';
import { Review } from './screens/Review';
import { Welcome } from './screens/Welcome';
import { isReviewMode } from '../state/review';
import { progress, storageNotice } from '../state/progress';
import './App.css';

const seedOf = (s: string | undefined) => (s && /^\d+$/.test(s) ? Number(s) : undefined);

/** The screen inside the app frame for a route, and the tab it belongs to (null = unknown route). */
function screenFor(name: string, params: string[]): { tab: string; el: preact.JSX.Element } | null {
  switch (name) {
    case 'path':
      return { tab: 'path', el: <Path /> };
    case 'review':
      return { tab: 'review', el: <Review /> };
    case 'library': {
      const n = Number(params[1]);
      if (params[0] && Number.isInteger(n) && n > 0)
        return { tab: 'library', el: <LibraryLesson key={`${params[0]}/${n}`} moduleId={params[0]} n={n} /> };
      return { tab: 'library', el: <Library /> };
    }
    case 'me':
      return { tab: 'me', el: <Profile /> };
    case 'about':
      return { tab: 'me', el: <About /> };
    default:
      return null;
  }
}

function Notice() {
  const n = storageNotice.value;
  if (!n) return null;
  return (
    <div class="notice" role="status">
      <p>{t.notice[n]}</p>
      <button type="button" class="btn btn--quiet" onClick={() => (storageNotice.value = null)}>
        {t.notice.ok}
      </button>
    </div>
  );
}

export function App() {
  const { name, params } = route.value;

  // a lesson takes the whole screen: no header, credit or tab bar
  if (name === 'lesson' && params[0] && params[1]) {
    return (
      <div class="app app--lesson">
        <Lesson moduleId={params[0]} lessonId={params[1]} seed={seedOf(params[2])} />
      </div>
    );
  }
  if (name === 'practice' && isReviewMode(params[0])) {
    return (
      <div class="app app--lesson">
        <Practice mode={params[0]} seed={seedOf(params[1])} />
      </div>
    );
  }

  if (!progress.value.seenWelcome)
    return (
      <div class="app app--lesson">
        <Welcome />
      </div>
    );

  const screen = screenFor(name, params);
  return (
    <div class="app">
      <header class="app__header">
        <span class="app__brand">{t.appName}</span>
        <span class="app__tagline">{t.tagline}</span>
        <HeaderStats />
      </header>
      <Notice />
      <main class="app__main" id="main">
        {screen ? (
          screen.el
        ) : (
          <section class="app__missing">
            <p>{t.notFound}</p>
            <a class="btn" href={href('path')}>
              {t.goHome}
            </a>
          </section>
        )}
      </main>
      <footer class="app__credit">{t.credit}</footer>
      <TabBar current={screen?.tab ?? name} />
    </div>
  );
}
