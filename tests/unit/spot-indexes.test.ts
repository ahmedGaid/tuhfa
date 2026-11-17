// @vitest-environment node
import { describe, expect, it } from 'vitest';
import madd from '../../src/content/modules/madd/index.ts';
import { spotWords } from '../../src/engine/spot.ts';
import { looseKey } from '../../scripts/lib/quran.ts';

// research R7 — every answer index points at the word the note names
describe('spot («لوّن الحكم») indexes', () => {
  it('splits on spaces and drops mark-only tokens', () => {
    expect(spotWords('رَبِّ ٱلْعَـٰلَمِينَ ۝ ٱلرَّحْمَـٰنِ')).toEqual(['رَبِّ', 'ٱلْعَـٰلَمِينَ', 'ٱلرَّحْمَـٰنِ']);
    expect(spotWords('لَا رَيْبَ ۛ فِيهِ')).toEqual(['لَا', 'رَيْبَ', 'فِيهِ']);
  });

  for (const s of madd.spot ?? []) {
    it(`${s.id} ${s.title}`, () => {
      const words = spotWords(s.ayah);
      expect(s.answer).toHaveLength(s.expectWords.length);
      s.answer.forEach((i, k) => {
        expect(i).toBeLessThan(words.length);
        expect(looseKey(words[i]!).key).toBe(looseKey(s.expectWords[k]!).key);
      });
    });
  }
});
