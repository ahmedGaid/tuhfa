import { route, href } from './router';
import { t } from './strings.ar';
import { TabBar } from './components/TabBar';
import { HeaderStats } from './components/HeaderStats';
import { Placeholder } from './screens/Placeholder';
import { Lesson } from './screens/Lesson';
import { Path } from './screens/Path';
import { Settings } from './screens/Settings';
import { Welcome } from './screens/Welcome';
import { progress, storageNotice } from '../state/progress';
import './App.css';

const tabs = ['path', 'review', 'library', 'me'] as const;
type Tab = (typeof tabs)[number];
const isTab = (name: string): name is Tab => (tabs as readonly string[]).includes(name);

function TabScreen({ tab }: { tab: Tab }) {
  if (tab === 'path') return <Path />;
  if (tab === 'me') return <Settings />;
  return <Placeholder title={t.tabs[tab]} body={t.placeholder[tab]} />;
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
    const seed = params[2] && /^\d+$/.test(params[2]) ? Number(params[2]) : undefined;
    return (
      <div class="app app--lesson">
        <Lesson moduleId={params[0]} lessonId={params[1]} seed={seed} />
      </div>
    );
  }

  if (!progress.value.seenWelcome)
    return (
      <div class="app app--lesson">
        <Welcome />
      </div>
    );

  return (
    <div class="app">
      <header class="app__header">
        <span class="app__brand">{t.appName}</span>
        <span class="app__tagline">{t.tagline}</span>
        <HeaderStats />
      </header>
      <Notice />
      <main class="app__main" id="main">
        {isTab(name) ? (
          <TabScreen tab={name} />
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
