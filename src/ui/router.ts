import { signal } from '@preact/signals';

/** Hash routes: #/path, #/review, #/library, #/me … (GitHub Pages has no rewrites). */
export type Route = { name: string; params: string[] };

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  const [name = '', ...params] = clean.split('/').map(decodeURIComponent);
  return { name: name || 'path', params };
}

export const route = signal<Route>(parseHash(typeof location === 'undefined' ? '' : location.hash));

export function startRouter(): void {
  const update = () => {
    route.value = parseHash(location.hash);
  };
  window.addEventListener('hashchange', update);
  update();
}

export function href(...parts: string[]): string {
  return '#/' + parts.map(encodeURIComponent).join('/');
}
