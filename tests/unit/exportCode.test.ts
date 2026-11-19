import { describe, expect, it } from 'vitest';
import { checksum, exportCode, importCode, PREFIX } from '../../src/state/exportCode.ts';
import { applyLesson } from '../../src/state/progress.ts';
import { freshProgress, type Progress } from '../../src/state/schema.ts';

const played: Progress = {
  ...applyLesson(
    freshProgress(),
    {
      moduleId: 'madd',
      lessonId: 'l1',
      stars: 2,
      accuracy: 0.8,
      xp: 120,
      right: ['tabii'],
      wrong: ['muttasil'],
    },
    '2026-11-19',
  ),
  settings: { goal: 50, sound: false, teacher: true, theme: 'dark' },
  seenWelcome: true,
};

/** Re-sign a tampered payload so only the schema / version check can reject it. */
function signed(json: unknown): string {
  const b = Buffer.from(JSON.stringify(json), 'utf8').toString('base64url');
  return `${PREFIX}${b}.${checksum(b)}`;
}

describe('export code', () => {
  it('round-trips stars, XP, streak, review boxes, mistakes and settings', () => {
    const code = exportCode(played);
    expect(code.startsWith('TUHFA1.')).toBe(true);
    expect(code).toMatch(/^TUHFA1\.[\w-]+\.[0-9a-z]{4}$/);
    expect(importCode(code)).toEqual({ ok: true, progress: played });
  });

  it('survives spaces and line breaks added by chat apps', () => {
    const code = exportCode(played);
    const messy = ` ${code.slice(0, 20)}\n${code.slice(20, 50)} ${code.slice(50)}\n`;
    expect(importCode(messy)).toEqual({ ok: true, progress: played });
  });

  it('wrong prefix → prefix error', () => {
    expect(importCode('hello')).toEqual({ ok: false, error: 'prefix' });
    expect(importCode(exportCode(played).replace('TUHFA1', 'TUHFA2'))).toEqual({
      ok: false,
      error: 'prefix',
    });
  });

  it('one changed character or a cut code → checksum error', () => {
    const code = exportCode(played);
    const i = PREFIX.length + 10;
    const flipped = code.slice(0, i) + (code[i] === 'A' ? 'B' : 'A') + code.slice(i + 1);
    expect(importCode(flipped)).toEqual({ ok: false, error: 'checksum' });
    expect(importCode(code.slice(0, -6))).toEqual({ ok: false, error: 'checksum' });
    expect(importCode(PREFIX)).toEqual({ ok: false, error: 'checksum' });
  });

  it('valid checksum but bad shape → schema error', () => {
    expect(importCode(signed({ version: 1, lessons: 'nope' }))).toEqual({ ok: false, error: 'schema' });
    expect(importCode(signed([1, 2]))).toEqual({ ok: false, error: 'schema' });
    const b = 'bm90LWpzb24';
    expect(importCode(`${PREFIX}${b}.${checksum(b)}`)).toEqual({ ok: false, error: 'schema' });
  });

  it('a code from a newer app version → future error', () => {
    expect(importCode(signed({ ...played, version: 99 }))).toEqual({ ok: false, error: 'future' });
  });

  it('keeps Arabic text intact (UTF-8)', () => {
    const p = { ...played, mistakes: ['madd/مد'] } as Progress;
    expect(importCode(exportCode(p))).toEqual({ ok: true, progress: p });
  });
});
