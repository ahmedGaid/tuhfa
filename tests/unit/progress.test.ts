import { describe, expect, it } from 'vitest';
import { applyLesson, lessonStates, seenConcepts, type LessonOutcome } from '../../src/state/progress.ts';
import { freshProgress } from '../../src/state/schema.ts';

const outcome = (o: Partial<LessonOutcome> = {}): LessonOutcome => ({
  moduleId: 'madd',
  lessonId: 'a1',
  stars: 2,
  accuracy: 0.8,
  xp: 100,
  right: [],
  wrong: [],
  ...o,
});

describe('applyLesson', () => {
  it('records stars, XP for today and starts the streak', () => {
    const p = applyLesson(freshProgress(), outcome(), '2026-11-18');
    expect(p.lessons['madd/a1']).toEqual({ stars: 2, best: 0.8, done: '2026-11-18' });
    expect(p.xp).toEqual({ total: 100, byDay: { '2026-11-18': 100 } });
    expect(p.streak).toEqual({ count: 1, lastDay: '2026-11-18' });
  });

  it('stars and best accuracy never go down on a replay', () => {
    let p = applyLesson(freshProgress(), outcome({ stars: 3, accuracy: 0.95 }), '2026-11-18');
    p = applyLesson(p, outcome({ stars: 1, accuracy: 0.5, xp: 30 }), '2026-11-18');
    expect(p.lessons['madd/a1']).toMatchObject({ stars: 3, best: 0.95 });
    expect(p.xp.byDay['2026-11-18']).toBe(130);
  });

  it('two days in a row → streak 2', () => {
    let p = applyLesson(freshProgress(), outcome(), '2026-11-18');
    p = applyLesson(p, outcome({ lessonId: 'a2' }), '2026-11-19');
    expect(p.streak.count).toBe(2);
  });

  it('right → next Leitner box; wrong → box 1, due tomorrow, into mistakes', () => {
    let p = applyLesson(freshProgress(), outcome({ right: ['tab', 'tab', 'harf'] }), '2026-11-18');
    expect(p.srs['madd/tab']).toEqual({ box: 1, due: '2026-11-19', wrong: 0 });
    p = applyLesson(p, outcome({ right: ['tab'] }), '2026-11-19');
    expect(p.srs['madd/tab']).toEqual({ box: 2, due: '2026-11-21', wrong: 0 });
    p = applyLesson(p, outcome({ right: ['tab'], wrong: ['tab', 'harf', 'tab'] }), '2026-11-20');
    expect(p.srs['madd/tab']).toEqual({ box: 1, due: '2026-11-21', wrong: 2 });
    expect(p.srs['madd/harf']).toMatchObject({ box: 1, wrong: 1 });
    expect(p.mistakes).toEqual(['madd/tab', 'madd/harf']);
  });

  it('box tops out at 5 (14 days)', () => {
    let p = freshProgress();
    for (let i = 0; i < 7; i++) p = applyLesson(p, outcome({ right: ['tab'] }), '2026-11-18');
    expect(p.srs['madd/tab']).toEqual({ box: 5, due: '2026-12-02', wrong: 0 });
  });

  it('mistakes stay unique, newest first', () => {
    let p = applyLesson(freshProgress(), outcome({ wrong: ['a'] }), '2026-11-18');
    p = applyLesson(p, outcome({ wrong: ['b'] }), '2026-11-18');
    p = applyLesson(p, outcome({ wrong: ['a'] }), '2026-11-18');
    expect(p.mistakes).toEqual(['madd/a', 'madd/b']);
  });
});

describe('lessonStates (unlock)', () => {
  const ids = ['a1', 'a2', 'a3'];

  it('fresh module: first lesson current, the rest locked', () => {
    expect(lessonStates(freshProgress(), 'madd', ids, false)).toEqual(['current', 'locked', 'locked']);
  });

  it('a done lesson opens the next one', () => {
    const p = applyLesson(freshProgress(), outcome(), '2026-11-18');
    expect(lessonStates(p, 'madd', ids, false)).toEqual(['done', 'current', 'locked']);
  });

  it('teacher mode opens every lesson', () => {
    expect(lessonStates(freshProgress(), 'madd', ids, true)).toEqual(['current', 'open', 'open']);
  });

  it('teach cards of done lessons count as seen', () => {
    const p = applyLesson(freshProgress(), outcome(), '2026-11-18');
    const seen = seenConcepts(p, 'madd', [
      { id: 'a1', newConcept: 'tab' },
      { id: 'a2', newConcept: 'harf' },
    ]);
    expect([...seen]).toEqual(['tab']);
  });
});
