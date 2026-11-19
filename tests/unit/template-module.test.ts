import { describe, expect, it } from 'vitest';
import { CourseSchema, ModuleSchema } from '../../src/content/schema.ts';
import { grade } from '../../src/engine/grade.ts';
import { mulberry32 } from '../../src/engine/rng.ts';
import { summarize } from '../../src/engine/scoring.ts';
import {
  advance,
  buildSession,
  currentStep,
  isFinished,
  recordAnswer,
  startSession,
} from '../../src/engine/session.ts';
import type { Answer, Item } from '../../src/engine/types.ts';
import { applyLesson, lessonStates } from '../../src/state/progress.ts';
import { freshProgress } from '../../src/state/schema.ts';

/**
 * T061 / US7 — a new باب is data only. The `_template` module, registered in a test course the same
 * way `course.ts` registers Madd, loads, parses, plays every lesson to the end and unlocks the next
 * one — with no change to the engine or the state code.
 */

const course = CourseSchema.parse({
  modules: [
    { id: 'madd', title: 'أحكام المد والقصر', icon: 'ا', status: 'soon' },
    {
      id: 'template',
      title: 'اسم الباب',
      icon: 'أ',
      color: { light: '#0a7ea8', dark: '#5cc6ea' },
      status: 'ready',
      load: () => import('../../src/content/modules/_template/index.ts'),
    },
  ],
});

const right = (item: Item): Answer =>
  item.mode === 'choice' || item.mode === 'tf' ? item.answer : { mistakes: 0 };

describe('_template registered as a ready module (T061)', () => {
  it('loads through the course registry and parses', async () => {
    const ref = course.modules.find((m) => m.id === 'template')!;
    expect(ref.status).toBe('ready');
    if (ref.status !== 'ready') return;
    const mod = ModuleSchema.parse((await ref.load()).default);
    expect(mod.id).toBe(ref.id);
    expect(mod.units.flatMap((u) => u.lessons).length).toBeGreaterThan(0);
  });

  it('plays every lesson to the end with right answers, then the next lesson opens', async () => {
    const ref = course.modules.find((m) => m.id === 'template')!;
    if (ref.status !== 'ready') throw new Error('not ready');
    const mod = ModuleSchema.parse((await ref.load()).default);
    const lessons = mod.units.flatMap((u) => u.lessons);
    const ids = lessons.map((l) => l.id);
    let p = freshProgress();
    expect(lessonStates(p, mod.id, ids, false)[0]).toBe('current');

    lessons.forEach((lesson, n) => {
      const rng = mulberry32(n + 1);
      let s = startSession(buildSession(mod, lesson, rng));
      expect(
        s.steps.some((x) => x.type === 'item'),
        lesson.id,
      ).toBe(true);
      for (let guard = 0; !isFinished(s) && guard < 200; guard++) {
        const step = currentStep(s)!;
        if (step.type === 'item') s = recordAnswer(s, grade(step.item, right(step.item)), rng);
        s = advance(s);
      }
      expect(isFinished(s)).toBe(true);
      const r = summarize(s.answered, s.correct, s.hadMistake);
      expect(r.stars).toBe(3);
      p = applyLesson(
        p,
        { moduleId: mod.id, lessonId: lesson.id, ...r, right: s.right, wrong: s.wrong },
        '2026-11-19',
      );
      const states = lessonStates(p, mod.id, ids, false);
      expect(states[n]).toBe('done');
      if (n + 1 < ids.length) expect(states[n + 1]).toBe('current');
    });
    expect(p.xp.total).toBeGreaterThan(0);
  });
});
