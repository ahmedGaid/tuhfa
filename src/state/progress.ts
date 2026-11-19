/**
 * Learner progress: pure transitions (lesson complete, unlock) + the app-wide signal that persists
 * itself (contract progress-storage.md). The engine stays content-free; this file only knows ids.
 */
import { effect, signal } from '@preact/signals';
import { addDays, today, type Day } from './date.ts';
import { freshProgress, type Progress } from './schema.ts';
import { browserStore, createSaver, load, type Notice } from './storage.ts';
import { bumpStreak } from './streak.ts';

export const lessonKey = (moduleId: string, lessonId: string) => `${moduleId}/${lessonId}`;
export const conceptKey = (moduleId: string, conceptId: string) => `${moduleId}/${conceptId}`;

/** Leitner intervals in days for boxes 1..5. */
export const INTERVALS = [1, 2, 4, 7, 14] as const;

export interface LessonOutcome {
  moduleId: string;
  lessonId: string;
  stars: 1 | 2 | 3;
  accuracy: number;
  xp: number;
  /** concept ids answered right / wrong in the session (SessionState.right / wrong) */
  right: readonly string[];
  wrong: readonly string[];
}

/** Lesson complete → stars max, XP (total + today), streak, SRS boxes, mistakes. */
export function applyLesson(p: Progress, o: LessonOutcome, day: Day): Progress {
  const key = lessonKey(o.moduleId, o.lessonId);
  const old = p.lessons[key];
  const lessons = {
    ...p.lessons,
    [key]: {
      stars: old ? (Math.max(old.stars, o.stars) as 1 | 2 | 3) : o.stars,
      best: Math.max(old?.best ?? 0, o.accuracy),
      done: day,
    },
  };

  const srs = { ...p.srs };
  const missed = new Set(o.wrong);
  const wrongCount = new Map<string, number>();
  for (const c of o.wrong) wrongCount.set(c, (wrongCount.get(c) ?? 0) + 1);
  for (const c of new Set([...o.right, ...o.wrong])) {
    const k = conceptKey(o.moduleId, c);
    const cur = srs[k];
    if (missed.has(c)) {
      srs[k] = { box: 1, due: addDays(day, 1), wrong: (cur?.wrong ?? 0) + wrongCount.get(c)! };
    } else {
      const box = Math.min(5, (cur?.box ?? 0) + 1);
      srs[k] = { box, due: addDays(day, INTERVALS[box - 1]!), wrong: cur?.wrong ?? 0 };
    }
  }

  // most recent first, unique
  const fresh = [...new Set([...o.wrong].reverse())].map((c) => conceptKey(o.moduleId, c));
  const mistakes = [...fresh, ...p.mistakes.filter((m) => !fresh.includes(m))];

  return {
    ...p,
    lessons,
    xp: { total: p.xp.total + o.xp, byDay: { ...p.xp.byDay, [day]: (p.xp.byDay[day] ?? 0) + o.xp } },
    streak: bumpStreak(p.streak, day),
    srs,
    mistakes,
  };
}

export type NodeState = 'done' | 'current' | 'open' | 'locked';

/**
 * Unlock rule (spec US3): inside a module, a lesson opens once the one before it is done. The first
 * lesson of every ready module is open («قريبًا» modules never block). Teacher mode opens everything.
 * `current` = the first open lesson not yet done.
 */
export function lessonStates(
  p: Progress,
  moduleId: string,
  lessonIds: readonly string[],
  teacher: boolean,
): NodeState[] {
  let prevDone = true;
  let currentSet = false;
  return lessonIds.map((id) => {
    const done = !!p.lessons[lessonKey(moduleId, id)];
    const open = teacher || prevDone;
    prevDone = done;
    if (done) return 'done';
    if (!open) return 'locked';
    if (!currentSet) {
      currentSet = true;
      return 'current';
    }
    return 'open';
  });
}

/** Concepts whose teach card was already seen: their introducing lesson is done. */
export function seenConcepts(
  p: Progress,
  moduleId: string,
  lessons: readonly { id: string; newConcept?: string | undefined }[],
): Set<string> {
  const out = new Set<string>();
  for (const l of lessons) if (l.newConcept && p.lessons[lessonKey(moduleId, l.id)]) out.add(l.newConcept);
  return out;
}

// ---------------------------------------------------------------- app state

export const progress = signal<Progress>(freshProgress());
export const storageNotice = signal<Notice | null>(null);

let started = false;

/** Load once at boot, then persist every change (debounced). */
export function initProgress(): void {
  if (started) return;
  started = true;
  const store = browserStore();
  const loaded = load(store);
  progress.value = loaded.progress;
  storageNotice.value = loaded.notice;
  if (!store || !loaded.writable) return;

  const saver = createSaver(store, () => {
    storageNotice.value = 'memory';
  });
  let first = true;
  effect(() => {
    const p = progress.value;
    if (first) {
      first = false;
      return;
    }
    saver.save(p);
  });
  addEventListener('pagehide', saver.flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saver.flush();
  });
}

export function completeLesson(o: LessonOutcome, day: Day = today()): void {
  progress.value = applyLesson(progress.value, o, day);
}
