/**
 * localStorage persistence (contract progress-storage.md). `load` never throws: corrupt data is kept
 * aside at `tuhfa:corrupt:<ts>` and the learner starts fresh; storage that refuses to work switches the
 * app to memory-only mode; a state written by a newer app version is read-only (never overwritten).
 */
import { migrations, ProgressSchema, VERSION, freshProgress, type Progress } from './schema.ts';

export const KEY = 'tuhfa:v1';

export interface KV {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type Notice = 'corrupt' | 'memory' | 'future';

export interface Loaded {
  progress: Progress;
  notice: Notice | null;
  /** false = never write (memory-only mode, or a newer version's data) */
  writable: boolean;
}

/** `window.localStorage`, or null where touching it throws (privacy modes, sandboxed frames). */
export function browserStore(): KV | null {
  try {
    const s = globalThis.localStorage;
    const probe = 'tuhfa:probe';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export function migrate(state: Record<string, unknown>): Record<string, unknown> {
  let s = state;
  for (let v = Number(s.version); v < VERSION; v++) {
    const step = migrations[v];
    if (!step) break;
    s = step(s);
  }
  return s;
}

export function load(store: KV | null, now: number = Date.now()): Loaded {
  if (!store) return { progress: freshProgress(), notice: 'memory', writable: false };
  let raw: string | null;
  try {
    raw = store.getItem(KEY);
  } catch {
    return { progress: freshProgress(), notice: 'memory', writable: false };
  }
  if (raw === null) return { progress: freshProgress(), notice: null, writable: true };

  const corrupt = (): Loaded => {
    try {
      store.setItem(`tuhfa:corrupt:${now}`, raw!);
    } catch {
      /* nothing more we can do; the fresh start still works */
    }
    return { progress: freshProgress(), notice: 'corrupt', writable: true };
  };

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return corrupt();
  }
  if (typeof data !== 'object' || data === null) return corrupt();
  const version = (data as { version?: unknown }).version;
  if (typeof version === 'number' && version > VERSION) {
    // a newer app wrote this: show what we can't read as fresh, and never overwrite it
    return { progress: freshProgress(), notice: 'future', writable: false };
  }
  const parsed = ProgressSchema.safeParse(migrate(data as Record<string, unknown>));
  return parsed.success ? { progress: parsed.data, notice: null, writable: true } : corrupt();
}

/** Debounced writer. On QuotaExceeded / SecurityError it gives up and reports `memory` once. */
export function createSaver(store: KV, onFail: () => void, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: Progress | undefined;
  let dead = false;

  const flush = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    if (dead || !pending) return;
    const p = pending;
    pending = undefined;
    try {
      store.setItem(KEY, JSON.stringify(p));
    } catch {
      dead = true;
      onFail();
    }
  };

  return {
    save(p: Progress) {
      if (dead) return;
      pending = p;
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(flush, delay);
    },
    flush,
  };
}
