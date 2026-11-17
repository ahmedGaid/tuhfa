/**
 * T017 — research R3: every `verified:true` Quran string must be a contiguous substring of its
 * referenced ayah(s) in the Tanzil text, after `normalize` (scripts/lib/quran.ts).
 *
 *   node scripts/verify-quran.ts [module]
 */
import { pathToFileURL } from 'node:url';
import type { Module } from '../src/content/schema.ts';
import { quranItems } from './lib/items.ts';
import { loadQuran, verifyText } from './lib/quran.ts';

export interface VerifyResult {
  checked: number;
  hidden: number;
  failures: string[];
}

export function verifyModule(m: Module): VerifyResult {
  const ayat = loadQuran();
  const result: VerifyResult = { checked: 0, hidden: 0, failures: [] };
  for (const item of quranItems(m)) {
    if (item.kind === 'library') continue; // reported by content-notes, not gated
    if (!item.verified) {
      result.hidden++;
      continue;
    }
    result.checked++;
    if (!item.ref) result.failures.push(`${item.id}: verified but has no ref`);
    else if (!verifyText(item.quran, item.ref, ayat))
      result.failures.push(
        `${item.id}: «${item.quran}» is not in Tanzil ${item.ref.sura}:${item.ref.aya}${item.ref.ayaTo ? `-${item.ref.ayaTo}` : ''}`,
      );
  }
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1]!).href) {
  const id = process.argv[2] ?? 'madd';
  const m = (await import(`../src/content/modules/${id}/index.ts`)).default as Module;
  const r = verifyModule(m);
  r.failures.forEach((f) => console.error(`✘ ${f}`));
  console.log(
    `${id}: ${r.checked} verified strings checked · ${r.failures.length} failures · ${r.hidden} hidden`,
  );
  process.exit(r.failures.length ? 1 : 0);
}
