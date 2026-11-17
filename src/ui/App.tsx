import { route, href } from './router';
import { t } from './strings.ar';
import { TabBar } from './components/TabBar';
import { Placeholder } from './screens/Placeholder';
import { Lesson } from './screens/Lesson';
import { firstLessonHref } from './modules';
import './App.css';

const tabs = ['path', 'review', 'library', 'me'] as const;
type Tab = (typeof tabs)[number];
const isTab = (name: string): name is Tab => (tabs as readonly string[]).includes(name);

export function App() {
  const { name, params } = route.value;

  // a lesson takes the whole screen: no header, credit or tab bar
  if (name === 'lesson' && params[0] && params[1]) {
    const seed = params[2] && /^\d+$/.test(params[2]) ? Number(params[2]) : undefined;
    return (
      <div class="app app--lesson">
        <Lesson moduleId={params[0]} lessonId={params[1]} seed={seed} />
      </div>
    );
  }

  return (
    <div class="app">
      <header class="app__header">
        <span class="app__brand">{t.appName}</span>
        <span class="app__tagline">{t.tagline}</span>
      </header>
      <main class="app__main" id="main">
        {isTab(name) ? (
          <Placeholder title={t.tabs[name]} body={t.placeholder[name]}>
            {/* until the path lands in M4, the first lesson is one tap away */}
            {name === 'path' && (
              <a class="btn btn--primary" href={firstLessonHref}>
                {t.startFirst}
              </a>
            )}
          </Placeholder>
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
      <TabBar current={name} />
    </div>
  );
}
