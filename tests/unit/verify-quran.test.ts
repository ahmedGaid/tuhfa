// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  findExact,
  findLoose,
  looseKey,
  normalize,
  refText,
  segments,
  verifyText,
} from '../../scripts/lib/quran.ts';

// Built from code points so the two spellings are really different byte sequences.
const ALEF_MADDA = String.fromCodePoint(0x0622); // آ precomposed
const ALEF_PLUS_MADDAH = String.fromCodePoint(0x0627, 0x0653); // ا + maddah (Tanzil)
const FATHA_SHADDA = String.fromCodePoint(0x064e, 0x0651);
const SHADDA_FATHA = String.fromCodePoint(0x0651, 0x064e);

describe('normalize (research R3)', () => {
  it('treats precomposed آ and ا + maddah as the same text', () => {
    expect(normalize(`ض${ALEF_MADDA}ل`)).toBe(normalize(`ض${ALEF_PLUS_MADDAH}ل`));
  });
  it('accepts fatha+shadda in either typing order', () => {
    expect(normalize(`ض${FATHA_SHADDA}`)).toBe(normalize(`ض${SHADDA_FATHA}`));
  });
  it('drops pause marks, ayah-end and tatweel; collapses spaces', () => {
    expect(normalize('لَا رَيْبَ ۛ  فِيهِ ۝')).toBe(normalize('لَا رَيْبَ فِيهِ'));
    expect(normalize('ٱلرَّحْمَـٰنِ')).toBe(normalize('ٱلرَّحْمَٰنِ'));
  });
  it('keeps harakat and small Uthmani signs significant', () => {
    expect(normalize('قَالَ')).not.toBe(normalize('قِيلَ'));
    expect(normalize('ءَامَنُوا۟')).not.toBe(normalize('ءَامَنُوا'));
    expect(normalize('ٱلْحَمْدُ')).not.toBe(normalize('الْحَمْدُ'));
  });
  it('splits « ... » skips into ordered parts', () => {
    expect(segments('أ ... ب … ج')).toEqual(['أ', 'ب', 'ج']);
  });
});

describe('verifyText against Tanzil', () => {
  it('accepts a substring of the referenced ayah', () => {
    expect(verifyText('ٱلْحَمْدُ لِلَّهِ', { sura: 1, aya: 2 })).toBe(true);
  });
  it('rejects text from another ayah or with different harakat', () => {
    expect(verifyText('ٱلْحَمْدُ لِلَّهِ', { sura: 1, aya: 3 })).toBe(false);
    expect(verifyText('ٱلْحَمْدَ لِلَّهِ', { sura: 1, aya: 2 })).toBe(false);
  });
  it('handles ayah ranges and skipped words, in order only', () => {
    expect(verifyText('رَبِّ ٱلْعَـٰلَمِينَ ۝ ٱلرَّحْمَـٰنِ', { sura: 1, aya: 2, ayaTo: 3 })).toBe(true);
    expect(verifyText('صِرَٰطَ ٱلَّذِينَ ... ٱلضَّآلِّينَ', { sura: 1, aya: 7 })).toBe(true);
    expect(verifyText('ٱلضَّآلِّينَ ... صِرَٰطَ', { sura: 1, aya: 7 })).toBe(false);
  });
});

describe('ayah search (research R4)', () => {
  it('finds an exact, word-bounded hit', () => {
    const hits = findExact('ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ');
    expect(hits.map((h) => h.ref)).toContainEqual({ sura: 1, aya: 2 });
  });
  it('does not match inside a longer word', () => {
    expect(findExact('حَمْدُ')).toHaveLength(0);
  });
  it('suggests the verbatim Tanzil text for typed (non-Uthmani) spelling', () => {
    const hits = findLoose('وَلَا الضَّآلِّينَ');
    expect(hits).toHaveLength(1);
    expect(hits[0]!.ref).toEqual({ sura: 1, aya: 7 });
    // a verbatim slice of the Tanzil ayah, with the Uthmani ٱ
    expect(refText({ sura: 1, aya: 7 })!.endsWith(hits[0]!.tanzil)).toBe(true);
    expect(hits[0]!.tanzil.split(' ')).toHaveLength(2);
    expect(hits[0]!.tanzil).toContain('ٱ');
  });
  it('reads وٰ as alef, and small waw as a letter in the fallback tier', () => {
    expect(looseKey('ٱلصَّلَوٰةَ').key).toBe(looseKey('الصَّلَاةَ').key);
    expect(findLoose('يَلْوُونَ')[0]?.tanzil).toBe('يَلْوُۥنَ');
  });
});
