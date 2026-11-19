/**
 * T066 — bundle budget: all JS + CSS in `dist/` together ≤ 150 KB gzip (plan.md performance goal).
 * Fonts, book pages and icons are precached for offline use but are not part of the code budget.
 * Run after `npm run build`: `npm run size`. Exit 1 when over budget.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 150;
const DIST = 'dist';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

const rows = files(DIST)
  .filter((f) => /\.(js|css)$/.test(f))
  .map((f) => ({
    file: relative(DIST, f).replaceAll('\\', '/'),
    kb: gzipSync(readFileSync(f)).length / 1024,
  }))
  .sort((a, b) => b.kb - a.kb);

const total = rows.reduce((s, r) => s + r.kb, 0);
for (const r of rows) console.log(`${r.kb.toFixed(1).padStart(7)} KB  ${r.file}`);
console.log(`${total.toFixed(1).padStart(7)} KB  total gzip (budget ${BUDGET_KB} KB)`);
if (total > BUDGET_KB) {
  console.error(`Over budget by ${(total - BUDGET_KB).toFixed(1)} KB`);
  process.exit(1);
}
