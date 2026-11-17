/**
 * T020 — write CONTENT_NOTES.md: the founder's review list.
 *
 *   node scripts/content-notes.ts [module]
 *
 * Everything between the GENERATED markers is rewritten from data/locate-<module>.json and the
 * module data. Everything after `<!-- manual:start -->` (book ↔ prototype disagreements, decisions)
 * is kept as is.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import type { Module } from '../src/content/schema.ts';
import { formatFiles } from './lib/emit.ts';
import { BULK_MARK, NOTES, refKey, reportPath, type LocateRow } from './locate-ayah.ts';

const GEN_START = '<!-- generated:start -->';
const GEN_END = '<!-- generated:end -->';
const MANUAL = '<!-- manual:start -->';
export const THIN_HEADING = '## E. Thin concepts';

const DEFAULT_MANUAL = `${MANUAL}

## G. Book ↔ prototype (read by hand — the book wins)

_Filled while reading \`reference/img/*\` and the book PDFs against the extracted data (task T021)._
`;

const code = (s: string) => '`' + s.replace(/`/g, "'") + '`';
const line = (r: LocateRow, c: LocateRow['candidates'][number]) =>
  `- [ ] ${code(r.id)} → ${refKey(c.ref)} ${code(c.tanzil)}`;

/** concepts with fewer than 2 verified examples */
export function thinConcepts(m: Module) {
  return m.concepts
    .map((c) => ({ c, n: c.examples.filter((e) => e.verified).length }))
    .filter((x) => x.n < 2);
}

export function renderNotes(m: Module, rows: LocateRow[]): string {
  const items = rows.filter((r) => r.kind !== 'library');
  const lib = rows.filter((r) => r.kind === 'library');
  const by = (s: LocateRow['status'], list = items) => list.filter((r) => r.status === s);
  const verified = by('verified').length + by('auto').length;
  const uniqueSuggest = by('suggest').filter((r) => r.hits === 1);
  const manySuggest = by('suggest').filter((r) => r.hits > 1);
  const out: string[] = [];
  const p = (...s: string[]) => out.push(...s);

  p(
    `# Content notes — ${m.title} (\`${m.id}\`)`,
    '',
    'Founder review list. **Quran text that is not verified is hidden from exercises** (FR-005), so',
    'every tick below brings an example back into the app.',
    '',
    '**How to review**',
    '',
    '1. Tick the right line: `- [ ]` → `- [x]` (one line per item). The text after the ref is the exact',
    '   Tanzil text that will replace the typed text.',
    '2. Run `npm run content:apply` — it re-checks each tick against Tanzil, writes it into the data,',
    '   and rewrites this list. Then `npm run validate`.',
    '3. Wrong example, or nothing fits? Write it under section G below; Claude fixes the data.',
    '',
    `**Now:** ${verified} of ${items.length} Quran strings verified · ${uniqueSuggest.length} one-place`,
    `suggestions (A) · ${by('ambiguous').length + manySuggest.length} with several places (B) · ${by('none').length}`,
    `not found (C).`,
    '',
  );

  p(
    '## A. One place found — spelling differs from Tanzil',
    '',
    'The typed text matches exactly one place by its letters; Tanzil writes it in the Uthmani rasm',
    '(ٱ, small signs, ـٰ). Check the place, then tick.',
    '',
    `- [ ] **Apply every line of section A at once** ${BULK_MARK}`,
    '',
  );
  for (const r of uniqueSuggest) {
    p(
      `**${r.context}** — typed: ${code(r.quran)}${r.note ? ` — note: ${r.note}` : ''}`,
      '',
      line(r, r.candidates[0]!),
      '',
    );
  }

  p(
    '## B. Several places — pick the one the Sheikh means',
    '',
    'The text is real Quran text but appears in more than one place. Tick ONE line (the first is a fine',
    'default if the note names no place). Only the first places are listed.',
    '',
  );
  for (const r of [...by('ambiguous'), ...manySuggest]) {
    p(
      `**${r.context}** — ${code(r.quran)} · ${r.hits} places${r.note ? ` — note: ${r.note}` : ''}`,
      '',
      ...r.candidates.map((c) => line(r, c)),
      '',
    );
  }

  p(
    '## C. Not found — needs a hand fix',
    '',
    'Usually a quote stitched from several ayat, or a description (e.g. «الميم من …») instead of Quran',
    'text. Say what it should be under section G.',
    '',
  );
  for (const r of by('none')) p(`- ${code(r.id)} **${r.context}** — ${code(r.quran)}`);
  p('');

  const multi = m.concepts.flatMap((c) =>
    c.examples.map((e, i) => ({ c, e, i })).filter(({ e }) => e.quran.trim().includes(' ')),
  );
  p(
    '## D. Multi-word examples — which other مدود are inside?',
    '',
    'Each example lists every concept it contains (`tags`), so «صنّف» never offers a "wrong" answer that',
    'is also right (research R6). Today each example is tagged only with its own concept. For these',
    'multi-word ones, write the other concepts present (e.g. "also tab") under section G.',
    '',
  );
  for (const { c, e, i } of multi)
    p(`- ${code(`concepts/${c.id}/examples/${i}`)} ${c.name}: ${code(e.quran)} — tags: ${e.tags.join(', ')}`);
  p('');

  p(
    THIN_HEADING,
    '',
    'Concepts with fewer than 2 verified examples (teach card shows fewer examples; validate warns).',
    '',
  );
  for (const { c, n } of thinConcepts(m)) p(`- ${code(c.id)} ${c.name} — ${n} verified`);
  p('');

  p(
    '## F. Library text (information)',
    '',
    `The library lessons quote ${lib.length} Quran spans. ${by('auto', lib).length} match Tanzil exactly,`,
    `${by('ambiguous', lib).length + by('suggest', lib).length} match by letters only, ${by('none', lib).length} are not found as one`,
    'piece. Library text is shown as written in the prototype until the founder asks for the Tanzil spelling',
    '(same tick flow; ids start with `lessons/`).',
    '',
  );
  for (const r of by('suggest', lib).filter((x) => x.hits === 1))
    p(`**${r.context}** — ${code(r.quran)}`, '', line(r, r.candidates[0]!), '');
  return out.join('\n');
}

export function writeNotes(m: Module, rows: LocateRow[]) {
  const old = existsSync(NOTES) ? readFileSync(NOTES, 'utf8') : '';
  const manual = old.includes(MANUAL) ? old.slice(old.indexOf(MANUAL)) : DEFAULT_MANUAL;
  writeFileSync(NOTES, `${GEN_START}\n\n${renderNotes(m, rows)}\n${GEN_END}\n\n${manual.trimEnd()}\n`);
  formatFiles([NOTES]);
}

if (import.meta.url === pathToFileURL(process.argv[1]!).href) {
  const id = process.argv[2] ?? 'madd';
  const m = (await import(`../src/content/modules/${id}/index.ts`)).default as Module;
  const rows = JSON.parse(readFileSync(reportPath(id), 'utf8')) as LocateRow[];
  writeNotes(m, rows);
  console.log(`wrote CONTENT_NOTES.md (${rows.length} rows)`);
}
