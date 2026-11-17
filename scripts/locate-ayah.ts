/**
 * T016 — find the surah:ayah of every Quran string in a module (research R4).
 *
 *   node scripts/locate-ayah.ts [module]          locate + write data/locate-<module>.json
 *   node scripts/locate-ayah.ts [module] --apply  also apply founder-ticked choices from CONTENT_NOTES.md
 *
 * Rules:
 * - Exactly one EXACT hit (R3 normalisation, word-bounded) → ref written, verified:true, text kept.
 * - Several exact hits → stays hidden; candidates go to CONTENT_NOTES.md (founder picks the place).
 * - No exact hit → letters-only search SUGGESTS the Tanzil text + ref. Never auto-verified.
 * - --apply: a ticked line `- [x] \`<id>\` → 2:255 \`<tanzil>\`` is re-checked against Tanzil, then
 *   written (text replaced by the exact Tanzil substring, verified:true).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Module, Ref } from '../src/content/schema.ts';
import { emitModule } from './lib/emit.ts';
import { quranItems, type ItemKind } from './lib/items.ts';
import { findExact, findLoose, loadQuran, refText, verifyText, normalize } from './lib/quran.ts';

export type Status = 'verified' | 'auto' | 'ambiguous' | 'suggest' | 'none';
export interface Candidate {
  ref: Ref;
  tanzil: string;
}
export interface LocateRow {
  id: string;
  kind: ItemKind;
  context: string;
  quran: string;
  note?: string | undefined;
  status: Status;
  /** total hits found (candidates holds at most MAX) */
  hits: number;
  candidates: Candidate[];
}

const MAX = 6;
const root = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));
export const reportPath = (id: string) => root(`data/locate-${id}.json`);
export const NOTES = root('CONTENT_NOTES.md');
/** marks the «apply all of section A» line in CONTENT_NOTES.md */
export const BULK_MARK = '<!-- bulk:unique -->';

const sameRef = (a: Ref, b: Ref) => a.sura === b.sura && a.aya === b.aya && (a.ayaTo ?? 0) === (b.ayaTo ?? 0);
const dedupe = (hits: Candidate[]) =>
  hits.filter((h, i) => hits.findIndex((x) => sameRef(x.ref, h.ref) && x.tanzil === h.tanzil) === i);

/** `2:255` or `1:2-3` */
export const refKey = (r: Ref) => `${r.sura}:${r.aya}${r.ayaTo ? `-${r.ayaTo}` : ''}`;
const parseRef = (s: string): Ref | undefined => {
  const m = /^(\d+):(\d+)(?:-(\d+))?$/.exec(s);
  if (!m) return undefined;
  return m[3] ? { sura: +m[1]!, aya: +m[2]!, ayaTo: +m[3] } : { sura: +m[1]!, aya: +m[2]! };
};

/** Ticked lines in CONTENT_NOTES.md: - [x] `id` → 2:255 `tanzil text` */
function tickedChoices(moduleId: string): Map<string, Candidate> {
  const out = new Map<string, Candidate>();
  if (!existsSync(NOTES)) return out;
  const lines = readFileSync(NOTES, 'utf8').split('\n');
  // ticked bulk line → every one-place suggestion of the last report (section A)
  const bulk = lines.some((l) => /^\s*- \[[xX]\]/.test(l) && l.includes(BULK_MARK));
  if (bulk && existsSync(reportPath(moduleId))) {
    const last = JSON.parse(readFileSync(reportPath(moduleId), 'utf8')) as LocateRow[];
    for (const r of last)
      if (r.kind !== 'library' && r.status === 'suggest' && r.hits === 1) out.set(r.id, r.candidates[0]!);
  }
  const single = new Set<string>();
  for (const line of lines) {
    const m = /^\s*- \[[xX]\] `([^`]+)` → (\S+) `([^`]+)`/.exec(line);
    if (!m) continue;
    const ref = parseRef(m[2]!);
    if (!ref) throw new Error(`bad ref in CONTENT_NOTES.md: ${line}`);
    if (single.has(m[1]!)) throw new Error(`two choices ticked for ${m[1]}`);
    single.add(m[1]!);
    out.set(m[1]!, { ref, tanzil: m[3]! });
  }
  return out;
}

export async function locate(moduleId: string, apply: boolean): Promise<LocateRow[]> {
  const dir = root(`src/content/modules/${moduleId}`);
  const mod = structuredClone((await import(pathToFileURL(`${dir}/index.ts`).href)).default as Module);
  const ayat = loadQuran();
  const items = quranItems(mod);
  let changed = false;

  if (apply) {
    for (const [id, choice] of tickedChoices(moduleId)) {
      const item = items.find((i) => i.id === id);
      if (!item) throw new Error(`CONTENT_NOTES.md ticks unknown item ${id}`);
      const text = refText(choice.ref, ayat);
      if (!text || !normalize(text).includes(normalize(choice.tanzil)))
        throw new Error(`${id}: ticked text is not in Tanzil ${refKey(choice.ref)} — not applied`);
      item.set(choice.ref, choice.tanzil);
      item.quran = choice.tanzil;
      item.ref = choice.ref;
      item.verified = true;
      changed = true;
      console.log(`applied ${id} → ${refKey(choice.ref)}`);
    }
  }

  const rows: LocateRow[] = [];
  for (const item of items) {
    const base = { id: item.id, kind: item.kind, context: item.context, quran: item.quran, note: item.note };
    if (item.ref && verifyText(item.quran, item.ref, ayat)) {
      rows.push({
        ...base,
        status: 'verified',
        hits: 1,
        candidates: [{ ref: item.ref, tanzil: item.quran }],
      });
      continue;
    }
    const exact = dedupe(findExact(item.quran, ayat));
    if (exact.length === 1) {
      const hit = exact[0]!;
      if (item.kind !== 'library') {
        item.set(hit.ref, item.quran);
        changed = true;
      }
      rows.push({ ...base, status: 'auto', hits: 1, candidates: [{ ref: hit.ref, tanzil: item.quran }] });
      continue;
    }
    if (exact.length > 1) {
      rows.push({
        ...base,
        status: 'ambiguous',
        hits: exact.length,
        candidates: exact.slice(0, MAX).map((h) => ({ ref: h.ref, tanzil: item.quran })),
      });
      continue;
    }
    const loose = dedupe(findLoose(item.quran, ayat));
    rows.push({
      ...base,
      status: loose.length ? 'suggest' : 'none',
      hits: loose.length,
      candidates: loose.slice(0, MAX),
    });
  }

  if (changed) emitModule(dir, mod);
  writeFileSync(reportPath(moduleId), JSON.stringify(rows, null, 2) + '\n');
  return rows;
}

if (import.meta.url === pathToFileURL(process.argv[1]!).href) {
  const args = process.argv.slice(2);
  const moduleId = args.find((a) => !a.startsWith('--')) ?? 'madd';
  const rows = await locate(moduleId, args.includes('--apply'));
  const count = (s: Status, k?: (r: LocateRow) => boolean) =>
    rows.filter((r) => r.status === s && (!k || k(r))).length;
  const lib = (r: LocateRow) => r.kind === 'library';
  const notLib = (r: LocateRow) => !lib(r);
  console.log(
    `${moduleId}: ${rows.filter(notLib).length} items — verified ${count('verified', notLib) + count('auto', notLib)} ` +
      `(new ${count('auto', notLib)}) · ambiguous ${count('ambiguous', notLib)} · suggest ${count('suggest', notLib)} · ` +
      `none ${count('none', notLib)}\nlibrary spans: ${rows.filter(lib).length} — exact ${count('auto', lib)} · ` +
      `ambiguous ${count('ambiguous', lib)} · suggest ${count('suggest', lib)} · none ${count('none', lib)}`,
  );
}
