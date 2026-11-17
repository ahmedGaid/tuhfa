import { route, href } from './router';
import { t } from './strings.ar';
import { TabBar } from './components/TabBar';
import { Placeholder } from './screens/Placeholder';
import './App.css';

const tabs = ['path', 'review', 'library', 'me'] as const;
type Tab = (typeof tabs)[number];
const isTab = (name: string): name is Tab => (tabs as readonly string[]).includes(name);

export function App() {
  const { name } = route.value;

  return (
    <div class="app">
      <header class="app__header">
        <span class="app__brand">{t.appName}</span>
        <span class="app__tagline">{t.tagline}</span>
      </header>
      <main class="app__main" id="main">
        {isTab(name) ? (
          <Placeholder title={t.tabs[name]} body={t.placeholder[name]} />
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
