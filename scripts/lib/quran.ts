/**
 * Tanzil Quran text helpers for the content scripts (research R3/R4). Build-time only.
 *
 * Two comparison levels:
 * - `normalize` (R3, used to VERIFY): Unicode NFD (canonical form: «آ» = «ا» + maddah, and
 *   fatha+shadda in either typing order — the same text by definition); collapse whitespace; drop
 *   pause marks, ayah-end / rub / sajdah signs and tatweel. Letters, harakat, maddah and small
 *   Uthmani signs stay — they are compared exactly.
 * - An example may skip words with « ... »: each part must appear, in order, in the same ayah(s).
 * - `looseKey` (R4, used only to SUGGEST a ref): letters only. Never marks anything verified.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export interface Ayah {
  sura: number;
  aya: number;
  text: string;
}

export interface Ref {
  sura: number;
  aya: number;
  ayaTo?: number;
}

export const QURAN_PATH = fileURLToPath(new URL('../../data/quran-uthmani.txt', import.meta.url));

let cache: Ayah[] | undefined;

/** All 6,236 ayat in Mushaf order. */
export function loadQuran(path = QURAN_PATH): Ayah[] {
  if (cache && path === QURAN_PATH) return cache;
  const ayat: Ayah[] = [];
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const [sura, aya, ...rest] = line.split('|');
    ayat.push({ sura: Number(sura), aya: Number(aya), text: rest.join('|').trim() });
  }
  if (ayat.length !== 6236) throw new Error(`expected 6236 ayat, got ${ayat.length}`);
  if (path === QURAN_PATH) cache = ayat;
  return ayat;
}

/** Pause marks ۖ ۗ ۘ ۙ ۚ ۛ, ayah end ۝, rub el hizb ۞, sajdah ۩, tatweel ـ. */
const NOT_COMPARED = /[ۖ-ۛ۝۞۩ـ]/g;

/** R3 normaliser — the verification compare. */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(NOT_COMPARED, '').replace(/\s+/g, ' ').trim();
}

/** « ... » marks skipped words inside one example. */
const ELLIPSIS = /\s*(?:\.\.\.|…)\s*/;
export const segments = (s: string) => s.split(ELLIPSIS).filter((p) => p.trim());

/** Do all `parts` occur in `hay`, in order, without overlapping? (plain substring) */
function inOrder(hay: string, parts: string[]): boolean {
  let from = 0;
  for (const p of parts) {
    const i = hay.indexOf(p, from);
    if (i === -1) return false;
    from = i + p.length;
  }
  return true;
}

/** Every mark that is not a base letter: harakat, maddah, hamza marks, dagger alef, small signs. */
const MARKS = /[ً-ٰٟۖ-ۭـ]/;

/**
 * Letters-only key, with an index map back into the source string so a key hit can be turned into
 * the exact Tanzil substring. `ٱ` → `ا`. Alef and alef-maqsura spelling differ between typed text
 * and the Uthmani rasm (الصالحات / ٱلصَّـٰلِحَـٰتِ), so plain alefs are dropped from the key, and a
 * و/ي carrying a dagger alef (ٱلصَّلَوٰةَ) counts as that alef.
 * `smallLetters`: read the small waw/yeh signs (ۥ ۦ ۧ) as letters (يَلْوُۥنَ = يلوون).
 */
export function looseKey(s: string, smallLetters = false): { key: string; map: number[] } {
  let key = '';
  const map: number[] = [];
  const chars = [...s];
  let offset = 0;
  chars.forEach((ch, i) => {
    const at = offset;
    offset += ch.length;
    let c = ch;
    if (smallLetters && (c === 'ۥ' || c === 'ۦ' || c === 'ۧ')) c = c === 'ۥ' ? 'و' : 'ي';
    else if (MARKS.test(c) || c === '۝' || c === '۞' || c === '۩') return;
    if (/\s/.test(c)) {
      if (key.endsWith(' ') || key === '') return;
      c = ' ';
    } else if (c === 'ٱ' || c === 'ا' || c === 'آ') return;
    else if ((c === 'و' || c === 'ى') && /^[ً-ْ]*ٰ/.test(chars.slice(i + 1, i + 4).join(''))) return;
    else if (c === 'ى') c = 'ي';
    key += c;
    map.push(at);
  });
  return { key: key.trimEnd(), map };
}

/** Text of a ref (ayah or ayah range), joined with single spaces. */
export function refText(ref: Ref, ayat = loadQuran()): string | undefined {
  const parts: string[] = [];
  for (let a = ref.aya; a <= (ref.ayaTo ?? ref.aya); a++) {
    const hit = ayat.find((x) => x.sura === ref.sura && x.aya === a);
    if (!hit) return undefined;
    parts.push(hit.text);
  }
  return parts.join(' ');
}

/** R3: is `quran` a contiguous substring of the referenced ayah(s) after normalisation? */
export function verifyText(quran: string, ref: Ref, ayat = loadQuran()): boolean {
  const text = refText(ref, ayat);
  return text !== undefined && inOrder(normalize(text), segments(quran).map(normalize));
}

export interface Hit {
  ref: Ref;
  /** the exact Tanzil substring that matched (verbatim from the file) */
  tanzil: string;
}

/** Word-bounded search of `needle` (already a key or normalised string) in `hay`. */
function findBounded(hay: string, needle: string, proclitic = false): number[] {
  const out: number[] = [];
  if (!needle) return out;
  let i = hay.indexOf(needle);
  while (i !== -1) {
    const before =
      i === 0 ||
      hay[i - 1] === ' ' ||
      // one attached letter: وَٱلصَّيْفِ for «الصيف»
      (proclitic && /[وفبلك]/.test(hay[i - 1]!) && (i === 1 || hay[i - 2] === ' '));
    const after = i + needle.length === hay.length || hay[i + needle.length] === ' ';
    if (before && after) out.push(i);
    i = hay.indexOf(needle, i + 1);
  }
  return out;
}

/** Number of ayat a text spans (prototype marks ayah ends with ۝). */
const spanOf = (s: string) => s.split('۝').filter((p) => p.trim()).length;

interface Win {
  ref: Ref;
  text: string;
  norm: string;
  loose: { key: string; map: number[] };
  small: { key: string; map: number[] };
}
const winCache = new Map<string, Win[]>();

function windows(ayat: Ayah[], span: number): Win[] {
  const cacheKey = `${span}:${ayat.length}:${ayat[0]?.text.length}`;
  const hit = winCache.get(cacheKey);
  if (hit) return hit;
  const out: Win[] = [];
  for (let i = 0; i + span <= ayat.length; i++) {
    const first = ayat[i]!;
    const last = ayat[i + span - 1]!;
    if (last.sura !== first.sura) continue;
    const ref: Ref =
      span > 1 ? { sura: first.sura, aya: first.aya, ayaTo: last.aya } : { sura: first.sura, aya: first.aya };
    const text = ayat
      .slice(i, i + span)
      .map((a) => a.text)
      .join(' ');
    out.push({ ref, text, norm: normalize(text), loose: looseKey(text), small: looseKey(text, true) });
  }
  winCache.set(cacheKey, out);
  return out;
}

/** First word-bounded occurrence of each part, in order; returns [start, end) per part or null. */
function boundedInOrder(hay: string, parts: string[], proclitic = false): [number, number][] | null {
  const spans: [number, number][] = [];
  let from = 0;
  for (const p of parts) {
    const at = findBounded(hay, p, proclitic).find((i) => i >= from);
    if (at === undefined) return null;
    spans.push([at, at + p.length]);
    from = at + p.length;
  }
  return spans;
}

/** Exact (R3-normalised), word-bounded hits. Basis for `verified:true`. */
export function findExact(quran: string, ayat = loadQuran()): Hit[] {
  const parts = segments(quran).map(normalize);
  const hits: Hit[] = [];
  for (const w of windows(ayat, spanOf(quran))) {
    if (parts.length === 1) {
      findBounded(w.norm, parts[0]!).forEach(() => hits.push({ ref: w.ref, tanzil: quran }));
    } else if (boundedInOrder(w.norm, parts)) hits.push({ ref: w.ref, tanzil: quran });
  }
  return hits;
}

/** Map a [start,end) key span back to the verbatim Tanzil substring (whole words). */
function original(text: string, map: number[], start: number, end: number): string {
  let s = map[start]!;
  const e = end < map.length ? map[end]! : text.length;
  // dropped leading letters (ٱ/ا/آ, or a proclitic) belong to the first word
  while (s > 0 && text[s - 1] !== ' ') s--;
  return text.slice(s, e).trimEnd();
}

/**
 * Letters-only, word-bounded hits. Suggestions for the founder — never auto-verified.
 * Tries, in order, until one tier finds something: plain key → small letters read as letters →
 * one attached proclitic letter allowed.
 */
export function findLoose(quran: string, ayat = loadQuran()): Hit[] {
  const tiers: { small: boolean; proclitic: boolean }[] = [
    { small: false, proclitic: false },
    { small: true, proclitic: false },
    { small: false, proclitic: true },
    { small: true, proclitic: true },
  ];
  for (const tier of tiers) {
    const parts = segments(quran).map((p) => looseKey(p, tier.small).key);
    const hits: Hit[] = [];
    for (const w of windows(ayat, spanOf(quran))) {
      const k = tier.small ? w.small : w.loose;
      const spans = boundedInOrder(k.key, parts, tier.proclitic);
      if (!spans) continue;
      if (parts.length === 1) {
        for (const at of findBounded(k.key, parts[0]!, tier.proclitic))
          hits.push({ ref: w.ref, tanzil: original(w.text, k.map, at, at + parts[0]!.length) });
      } else
        hits.push({ ref: w.ref, tanzil: spans.map(([a, b]) => original(w.text, k.map, a, b)).join(' ... ') });
    }
    if (hits.length) return hits;
  }
  return [];
}

/** «البقرة ٢:٢٥٥»-style ref label with Arabic-Indic digits. */
export function refLabel(ref: Ref): string {
  const d = (n: number) => n.toLocaleString('ar-EG', { useGrouping: false });
  return `${d(ref.sura)}:${d(ref.aya)}${ref.ayaTo ? '–' + d(ref.ayaTo) : ''}`;
}
