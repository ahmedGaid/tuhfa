import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshProgress } from '../../src/state/schema.ts';
import { KEY, createSaver, load, type KV } from '../../src/state/storage.ts';

class MemKV implements KV {
  data = new Map<string, string>();
  failWrites = false;
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    if (this.failWrites) throw new DOMException('full', 'QuotaExceededError');
    this.data.set(k, v);
  }
}

describe('load', () => {
  it('nothing stored → fresh progress, writable', () => {
    expect(load(new MemKV())).toEqual({ progress: freshProgress(), notice: null, writable: true });
  });

  it('round-trips a valid state', () => {
    const kv = new MemKV();
    const p = { ...freshProgress(), seenWelcome: true, xp: { total: 40, byDay: { '2026-11-18': 40 } } };
    kv.setItem(KEY, JSON.stringify(p));
    expect(load(kv).progress).toEqual(p);
  });

  it('corrupt JSON → copy kept aside, fresh start, one notice', () => {
    const kv = new MemKV();
    kv.setItem(KEY, '{not json');
    const r = load(kv, 123);
    expect(r.notice).toBe('corrupt');
    expect(r.progress).toEqual(freshProgress());
    expect(kv.getItem('tuhfa:corrupt:123')).toBe('{not json');
  });

  it('valid JSON in the wrong shape is treated as corrupt', () => {
    const kv = new MemKV();
    kv.setItem(KEY, JSON.stringify({ version: 1, lessons: 'nope' }));
    expect(load(kv, 5).notice).toBe('corrupt');
    expect(kv.getItem('tuhfa:corrupt:5')).not.toBeNull();
  });

  it('a newer version is read-only and never overwritten', () => {
    const kv = new MemKV();
    const raw = JSON.stringify({ version: 99, anything: true });
    kv.setItem(KEY, raw);
    const r = load(kv);
    expect(r.notice).toBe('future');
    expect(r.writable).toBe(false);
    expect(kv.getItem(KEY)).toBe(raw);
  });

  it('no storage at all → memory mode', () => {
    expect(load(null)).toMatchObject({ notice: 'memory', writable: false });
  });

  it('storage that throws on read → memory mode', () => {
    const kv: KV = {
      getItem: () => {
        throw new DOMException('blocked', 'SecurityError');
      },
      setItem: () => {},
    };
    expect(load(kv)).toMatchObject({ notice: 'memory', writable: false });
  });
});

describe('saver', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('debounces writes by 300 ms and keeps only the last state', () => {
    const kv = new MemKV();
    const saver = createSaver(kv, () => {});
    saver.save({ ...freshProgress(), seenWelcome: true });
    saver.save({ ...freshProgress(), xp: { total: 10, byDay: {} } });
    vi.advanceTimersByTime(299);
    expect(kv.getItem(KEY)).toBeNull();
    vi.advanceTimersByTime(1);
    expect(JSON.parse(kv.getItem(KEY)!).xp.total).toBe(10);
  });

  it('flush writes at once', () => {
    const kv = new MemKV();
    const saver = createSaver(kv, () => {});
    saver.save(freshProgress());
    saver.flush();
    expect(kv.getItem(KEY)).not.toBeNull();
  });

  it('quota error → memory fallback reported once, no more writes', () => {
    const kv = new MemKV();
    kv.failWrites = true;
    const onFail = vi.fn();
    const saver = createSaver(kv, onFail);
    saver.save(freshProgress());
    saver.flush();
    saver.save(freshProgress());
    saver.flush();
    expect(onFail).toHaveBeenCalledTimes(1);
  });
});
