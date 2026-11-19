import { useEffect, useState } from 'preact/hooks';

/** Run an async loader once per `deps`; `undefined` while loading, `null` when it failed. */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[]): T | null | undefined {
  const [v, setV] = useState<T | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setV(undefined);
    load()
      .then((x) => live && setV(x))
      .catch(() => live && setV(null));
    return () => {
      live = false;
    };
  }, deps);
  return v;
}
