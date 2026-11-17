import { t } from '../strings.ar';
import { href } from '../router';
import './TabBar.css';

export type TabId = 'path' | 'review' | 'library' | 'me';

// One icon hand: 24px, 2px stroke, round caps (ag-ui-standard rule 8). Self-drawn, no icon library.
const icons: Record<TabId, preact.JSX.Element> = {
  path: <path d="M6 20c0-4 4-4 6-8s6-4 6-8M6 20h.01M12 12h.01M18 4h.01" />,
  review: <path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4" />,
  library: <path d="M5 4h5a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H5zM19 4h-5a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h5z" />,
  me: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />,
};

const order: TabId[] = ['path', 'review', 'library', 'me'];

export function TabBar({ current }: { current: string }) {
  return (
    <nav class="tabbar" aria-label="التنقّل الرئيسي">
      {order.map((id) => (
        <a class="tabbar__item" href={href(id)} aria-current={current === id ? 'page' : undefined} key={id}>
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            {icons[id]}
          </svg>
          <span>{t.tabs[id]}</span>
        </a>
      ))}
    </nav>
  );
}
