/**
 * T063 — Principle III gate: green / red mean "right / wrong" and nothing else.
 *
 * - `--ok` / `--bad` may be defined only in `src/ui/theme.css`, and used only in CSS rules whose
 *   selector is an answer state (ok · bad · right · wrong) — never in TS/TSX inline styles.
 * - The raw feedback hexes may appear only in `src/ui/theme.css`.
 * Runs as part of `npm run lint` (so CI and the gates run it). Exit 1 + a list on any hit.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'src';
const THEME = 'src/ui/theme.css';
const HEXES = ['#1f9d55', '#4fd18b', '#d63a3a', '#ff7272'];
const TOKEN = /var\(\s*--(ok|bad)\b/g;
const STATE_SELECTOR = /(ok|bad|right|wrong)\b/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(css|tsx?)$/.test(f) ? [p] : [];
  });
}

/** The selector of the CSS rule that contains `index`. */
function selectorAt(css: string, index: number): string {
  const open = css.lastIndexOf('{', index);
  const before = css.slice(0, open);
  const start = Math.max(before.lastIndexOf('}'), before.lastIndexOf('{'), before.lastIndexOf('*/')) + 1;
  return before.slice(start).trim();
}

const lineOf = (text: string, index: number) => text.slice(0, index).split('\n').length;

const hits: string[] = [];
for (const file of files(ROOT)) {
  const path = relative('.', file).replaceAll('\\', '/');
  if (path === THEME) continue;
  const text = readFileSync(file, 'utf8');
  const lower = text.toLowerCase();
  for (const hex of HEXES) {
    const i = lower.indexOf(hex);
    if (i >= 0)
      hits.push(`${path}:${lineOf(text, i)} raw feedback colour ${hex} (use the token in theme.css)`);
  }
  for (const m of text.matchAll(TOKEN)) {
    const at = `${path}:${lineOf(text, m.index)}`;
    if (!path.endsWith('.css'))
      hits.push(`${at} --${m[1]} in code; feedback colours belong in CSS state rules`);
    else if (!STATE_SELECTOR.test(selectorAt(text, m.index)))
      hits.push(`${at} --${m[1]} outside an answer-state rule («${selectorAt(text, m.index)}»)`);
  }
}

if (hits.length) {
  console.error('Green/red are for answer feedback only (constitution III):\n' + hits.join('\n'));
  process.exit(1);
}
console.log('feedback colours: ok');
