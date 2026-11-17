/**
 * T022 — `npm run validate`: the CI content gate (contracts/content-module.md).
 *
 *   1 schema   course + every module folder parse (ids unique, references resolve, …)
 *   2 verify   every verified Quran string is in Tanzil at its ref (research R3)
 *   3 ambiguity every verified example of X is tagged X; X keeps a single-tag pick (research R6)
 *   4 spot     every answer index points at the word the note names (research R7)
 *   5 thin     concepts with < 2 verified examples are listed in CONTENT_NOTES.md (warning only)
 *   6 colour   category / module colours are ΔE ≥ 15 from the feedback green/red, and category
 *              colours equal their theme.css token
 *
 * Exit code 1 on any failure; warnings never fail the build.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { course } from '../src/content/course.ts';
import { ModuleSchema, type Module } from '../src/content/schema.ts';
import { spotWords } from '../src/engine/spot.ts';
import { looseKey } from './lib/quran.ts';
import { verifyModule } from './verify-quran.ts';

const root = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const failures: string[] = [];
const warnings: string[] = [];
const fail = (s: string) => failures.push(s);
const warn = (s: string) => warnings.push(s);

// ---- colour helpers (sRGB → CIE Lab, ΔE*76) ----------------------------------------------------
function lab(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const lin = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  const [r, g, b] = lin;
  const xyz = [
    (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047,
    0.2126 * r + 0.7152 * g + 0.0722 * b,
    (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883,
  ].map((t) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116)) as [number, number, number];
  return [116 * xyz[1] - 16, 500 * (xyz[0] - xyz[1]), 200 * (xyz[1] - xyz[2])];
}
export const deltaE = (a: string, b: string) => {
  const [x, y] = [lab(a), lab(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
};

const theme = readFileSync(root('src/ui/theme.css'), 'utf8');
const token = (name: string) => {
  const m = new RegExp(`--${name}:\\s*light-dark\\((#[0-9a-f]{3,6}),\\s*(#[0-9a-f]{3,6})\\)`, 'i').exec(
    theme,
  );
  return m ? { light: m[1]!, dark: m[2]! } : undefined;
};
const ok = token('ok');
const bad = token('bad');
if (!ok || !bad) fail('theme.css: --ok / --bad tokens not found');

function checkColour(where: string, c: { light: string; dark: string }) {
  if (!ok || !bad) return;
  for (const mode of ['light', 'dark'] as const)
    for (const [name, fb] of [
      ['green', ok],
      ['red', bad],
    ] as const) {
      const d = deltaE(c[mode], fb[mode]);
      if (d < 15) fail(`${where}: ${mode} colour ${c[mode]} is ΔE ${d.toFixed(1)} from feedback ${name}`);
    }
}

// ---- 1 schema ----------------------------------------------------------------------------------
course.modules.forEach((m) => m.color && checkColour(`course/${m.id}`, m.color));
const maddRef = course.modules.find((m) => m.id === 'madd');
const asli = token('cat-asli');
if (maddRef?.color && asli && (maddRef.color.light !== asli.light || maddRef.color.dark !== asli.dark))
  fail('course/madd colour drifted from --cat-asli in theme.css');

const notes = existsSync(root('CONTENT_NOTES.md')) ? readFileSync(root('CONTENT_NOTES.md'), 'utf8') : '';
const thinSection = notes.includes('## E. Thin concepts')
  ? notes.slice(notes.indexOf('## E. Thin concepts')).split('\n## ')[0]!
  : '';

const dirs = readdirSync(root('src/content/modules'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

for (const dir of dirs) {
  const mod = (await import(pathToFileURL(root(`src/content/modules/${dir}/index.ts`)).href))
    .default as Module;
  const parsed = ModuleSchema.safeParse(mod);
  if (!parsed.success) {
    for (const i of parsed.error.issues) fail(`${dir}: schema ${i.path.join('.')}: ${i.message}`);
    continue;
  }
  const m = parsed.data;
  const isTemplate = dir.startsWith('_');

  // ---- 2 verify --------------------------------------------------------------------------------
  const v = verifyModule(m);
  v.failures.forEach((f) => fail(`${dir}: ${f}`));

  // ---- 3 ambiguity -----------------------------------------------------------------------------
  for (const c of m.concepts) {
    const shown = c.examples.filter((e) => e.verified);
    shown.forEach((e) => {
      if (!e.tags.includes(c.id))
        fail(`${dir}: concept ${c.id}: verified example «${e.quran}» is not tagged ${c.id}`);
    });
    if (shown.length && !shown.some((e) => e.tags.length === 1))
      warn(
        `${dir}: concept ${c.id}: every verified example carries several tags — «صنّف» may lack a clean pick`,
      );
  }

  // ---- 4 spot ----------------------------------------------------------------------------------
  for (const s of m.spot ?? []) {
    const words = spotWords(s.ayah);
    s.answer.forEach((i, k) => {
      const w = words[i];
      if (w === undefined)
        fail(`${dir}: spot ${s.id}: answer index ${i} is past the last word (${words.length})`);
      else if (looseKey(w).key !== looseKey(s.expectWords[k] ?? '').key)
        fail(`${dir}: spot ${s.id}: word ${i} is «${w}», note says «${s.expectWords[k]}»`);
    });
  }

  // ---- 5 thin concepts -------------------------------------------------------------------------
  if (!isTemplate)
    for (const c of m.concepts) {
      const n = c.examples.filter((e) => e.verified).length;
      if (n >= 2) continue;
      if (!thinSection.includes('`' + c.id + '`'))
        warn(`${dir}: concept ${c.id} has ${n} verified examples and is not listed under thin concepts`);
    }

  // ---- 6 colour --------------------------------------------------------------------------------
  for (const cat of m.categories) {
    checkColour(`${dir}/category ${cat.id}`, cat.color);
    const t = token(`cat-${cat.id}`);
    if (t && (t.light !== cat.color.light || t.dark !== cat.color.dark))
      fail(`${dir}/category ${cat.id}: colour drifted from --cat-${cat.id} in theme.css`);
  }

  console.log(
    `✔ ${dir}: schema ok · ${v.checked} verified Quran strings match Tanzil · ${v.hidden} hidden (unverified) · ` +
      `${m.spot?.length ?? 0} spot items · ${m.categories.length} categories`,
  );
}

warnings.forEach((w) => console.warn(`! ${w}`));
failures.forEach((f) => console.error(`✘ ${f}`));
console.log(`validate: ${failures.length} failures · ${warnings.length} warnings`);
process.exit(failures.length ? 1 : 0);
