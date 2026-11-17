/**
 * T014 — extract the Madd content from reference/prototype.html into src/content/modules/madd/.
 *
 * The prototype is one big <script>. We parse it with the TypeScript compiler, keep ONLY the data
 * declarations (arrays/objects such as C, D, SP, M) and the exercise-generator functions (for their
 * prompt wording), and evaluate them in an empty `vm` context with stub helpers — no DOM, no
 * network. Every string comes from the prototype; nothing is retyped (constitution I).
 *
 * Run: node scripts/extract-prototype.ts
 * Re-running overwrites the module folder (then run locate-ayah.ts again).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
import type {
  Category,
  Concept,
  Example,
  Lesson,
  Module,
  Prompts,
  Question,
  QuestionExample,
  RulerRow,
  SpotItem,
  TreeNode,
  TuruqRow,
  Unit,
  LessonSpec,
} from '../src/content/schema.ts';
import { emitModule } from './lib/emit.ts';

const root = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const html = readFileSync(root('reference/prototype.html'), 'utf8');
const script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));

// ---------------------------------------------------------------------------------------------
// 1. Pick declarations out of the prototype script (top level of its wrapping block).
const DATA = new Set(['R', 'T', 'L', 'LF', 'FN', 'PG', 'D', 'QF', 'M', 'MF', 'LV', 'C', 'U', 'RANK', 'SP']);
const GENERATORS = new Set([
  'gClassify',
  'gAmount',
  'gHokm',
  'gTF',
  'gTF2',
  'gFill',
  'gMatch',
  'gOrder',
  'gSpot',
]);

const sf = ts.createSourceFile('prototype.js', script, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
const block = sf.statements.find(ts.isBlock);
if (!block) throw new Error('prototype script block not found');

const picked: string[] = [];
let lshowSource = '';
for (const st of block.statements) {
  if (ts.isVariableStatement(st)) {
    const names = st.declarationList.declarations.map((d) => d.name.getText(sf));
    if (names.some((n) => DATA.has(n))) picked.push(st.getText(sf));
  } else if (ts.isFunctionDeclaration(st) && st.name) {
    if (GENERATORS.has(st.name.text)) picked.push(st.getText(sf));
    if (st.name.text === 'lshow') lshowSource = st.getText(sf);
  }
}

// Stubs: deterministic helpers; `Q` marks Quran spans in library HTML (data-model: <q-t>).
const prelude = `
const Q = s => '<q-t>' + s + '</q-t>';
const rnd = a => a[0];
const shuf = a => a.slice();
const ex1 = c => c.ex[0];
function others(c, pool, k, fn) { return pool.filter(x => fn(x) !== fn(c)).slice(0, k); }
`;
const exportsExpr = `;({ R, T, L, LF, FN, PG, D, QF, M, MF, LV, C, U, RANK, SP,
  gClassify, gAmount, gHokm, gTF, gTF2, gFill, gMatch, gOrder, gSpot })`;

type Raw = {
  R: [string, number, number, string, string][];
  T: [string, string, string, string][];
  L: { t: string; g: string; h: string }[];
  LF: string;
  FN: Record<string, [string, string]>;
  PG: string[][];
  D: [string, string[], number, string, string, [string, string]][];
  QF: Record<string, string>;
  M: RawNode;
  MF: Record<string, string>;
  LV: { k: string; f: (n: RawNode) => boolean }[];
  C: {
    id: string;
    u: number;
    f: string;
    n: string;
    r: string;
    m: string;
    h?: string;
    ex: [string, string][];
    d: [string, string, string];
  }[];
  U: { t: string; f: string; cats: string[] }[];
  RANK: string[];
  SP: { u: number; f: string; t: string; a: string; k: number[]; n: string }[];
  [g: string]: unknown;
};
type RawNode = {
  t: string;
  e?: string;
  n?: string;
  c?: RawNode[];
  root?: number;
  k1?: number;
  v?: number;
  d?: number;
  leaf?: boolean;
};

const raw = vm.runInNewContext(prelude + picked.join('\n') + exportsExpr, Object.create(null), {
  timeout: 2000,
}) as Raw;
// Objects from another vm context: round-trip data through JSON so prototypes are plain.
const plain = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

// ---------------------------------------------------------------------------------------------
// 2. Categories — names/icons from the prototype legend (FN), colours from src/ui/theme.css.
const CAT_ID: Record<string, string> = { a: 'asli', h: 'hamz', s: 'sukun', m: 'manawi' };
const theme = readFileSync(root('src/ui/theme.css'), 'utf8');
const themeColor = (id: string) => {
  const m = new RegExp(`--cat-${id}:\\s*light-dark\\((#[0-9a-f]{6}),\\s*(#[0-9a-f]{6})\\)`, 'i').exec(theme);
  if (!m) throw new Error(`theme.css has no --cat-${id}`);
  return { light: m[1]!, dark: m[2]! };
};
const categories: Category[] = Object.entries(CAT_ID).map(([k, id]) => ({
  id,
  name: raw.FN[k]![1],
  icon: raw.FN[k]![0],
  color: themeColor(id),
}));
const catOf = (letter: string) => CAT_ID[letter];

// ---------------------------------------------------------------------------------------------
// 3. Examples — split display wrapper from Quran text (research R5).
const WAQF = /^(.*?)\s*\((وقفًا|وصلًا)\)$/;
const QUOTED = /«([^»]+)»/;
function splitExample(text: string): { quran: string; label?: string } {
  const w = WAQF.exec(text);
  if (w) return { quran: w[1]!, label: text };
  const q = QUOTED.exec(text);
  if (q) return { quran: q[1]!, label: text };
  return { quran: text };
}

const concepts: Concept[] = raw.C.map((c) => ({
  id: c.id,
  category: catOf(c.f)!,
  name: c.n,
  rule: c.r,
  amount: c.m,
  ...(c.h ? { ruling: c.h } : {}),
  examples: c.ex.map(([text, note]): Example => ({
    ...splitExample(text),
    note,
    verified: false,
    tags: [c.id],
  })),
  definition: c.d,
}));

// ---------------------------------------------------------------------------------------------
// 4. Library lessons (L) with category colour (LF) and book pages (PG).
const lessons: Lesson[] = raw.L.map((l, i) => ({
  title: l.t,
  ...(l.g ? { tag: l.g } : {}),
  ...(catOf(raw.LF[i] ?? 'n') ? { category: catOf(raw.LF[i]!)! } : {}),
  html: l.h.trim(),
  pages: raw.PG[i] ?? [],
}));

// ---------------------------------------------------------------------------------------------
// 5. Units. The prototype had one long lesson per unit; the spec (FR-003) wants one playable node
//    per concept plus a checkpoint per unit and a module checkpoint. Structure only — no text is
//    invented: titles are concept names / unit titles from the prototype.
const topicsOf = (u: number) => raw.U[u]!.cats;
const libraryIndex = (name: string) => {
  const i = raw.L.findIndex((l) => l.t.includes(name));
  return i === -1 ? {} : { libraryLesson: i };
};
const UNIT_IDS = ['asli', 'hamz', 'sukun', 'manawi', 'rank', 'review'];
const units: Unit[] = raw.U.map((u, i): Unit => {
  const id = UNIT_IDS[i]!;
  const own = raw.C.filter((c) => c.u === i + 1).map((c) => c.id);
  const lessonsOfUnit: LessonSpec[] = [];
  if (own.length) {
    own.forEach((cid, k) => {
      const c = raw.C.find((x) => x.id === cid)!;
      lessonsOfUnit.push({
        id: `${id}-${k + 1}`,
        title: c.n,
        newConcept: cid,
        practise: own.slice(0, k + 1),
        kind: 'lesson',
        ...libraryIndex(c.n),
      });
    });
    lessonsOfUnit.push({
      id: `${id}-checkpoint`,
      title: u.t,
      practise: own,
      kind: 'checkpoint',
      size: 15,
      topics: topicsOf(i),
    });
  } else if (u.cats.length) {
    // «المراتب والطرق»: rank card + order + fixed questions, then its checkpoint
    lessonsOfUnit.push({
      id: `${id}-1`,
      title: u.t,
      practise: [],
      kind: 'lesson',
      teachCard: 'rank',
      types: ['order', 'question'],
      topics: topicsOf(i),
    });
    lessonsOfUnit.push({
      id: `${id}-checkpoint`,
      title: u.t,
      practise: [],
      kind: 'checkpoint',
      types: ['order', 'question'],
      topics: topicsOf(i),
    });
  } else {
    lessonsOfUnit.push({
      id: `${id}-checkpoint`,
      title: u.t,
      practise: raw.C.map((c) => c.id),
      kind: 'module-checkpoint',
      size: 15,
    });
  }
  return {
    id,
    title: u.t,
    ...(catOf(u.f) ? { category: catOf(u.f)! } : {}),
    lessons: lessonsOfUnit,
  };
});

// ---------------------------------------------------------------------------------------------
// 6. Fixed questions (D).
const pad = (n: number) => String(n).padStart(2, '0');
const questions: Question[] = raw.D.map(([prompt, options, answer, explain, topic, ex], i) => {
  const example: QuestionExample = { ...splitExample(ex[0]), note: ex[1], verified: false };
  const cat = raw.QF[topic];
  return {
    id: `q${pad(i + 1)}`,
    prompt,
    options,
    answer,
    topic,
    ...(cat && catOf(cat) ? { category: catOf(cat)! } : {}),
    explain,
    example,
  };
});

// ---------------------------------------------------------------------------------------------
// 7. Spot ayat (SP). Concept from the prompt title; expectWords = the «quoted» words of the note,
//    in order, one per answer index (research R7).
const conceptByTitle = (t: string) => {
  const base = t.replace(/\s*\(.*\)\s*$/, '');
  const c = raw.C.find((x) => x.n === base);
  if (!c) throw new Error(`spot title "${t}" matches no concept`);
  return c.id;
};
const spot: SpotItem[] = raw.SP.map((s, i) => {
  const quoted = [...s.n.matchAll(/«([^»]+)»/g)].map((m) => m[1]!);
  return {
    id: `s${pad(i + 1)}`,
    unit: UNIT_IDS[s.u - 1]!,
    concept: conceptByTitle(s.t),
    title: s.t,
    ayah: s.a,
    verified: false,
    answer: s.k,
    note: s.n,
    expectWords: quoted.slice(0, s.k.length),
  };
});

// ---------------------------------------------------------------------------------------------
// 8. Tree (M) — port of the prototype walk, then «احفظ الخريطة» levels from LV filters.
(function walk(n: RawNode, d: number) {
  n.d = d;
  n.leaf = !n.c;
  (n.c ?? []).forEach((c) => walk(c, d + 1));
})(raw.M, 0);
const lvStructure = raw.LV.find((l) => l.k === 's')!.f;
const lvNames = raw.LV.find((l) => l.k === 'v')!.f;
function toTree(n: RawNode, inherited?: string): TreeNode {
  const cat = raw.MF[n.t] ? catOf(raw.MF[n.t]!) : inherited;
  const s = lvStructure(n);
  const v = lvNames(n);
  const node: TreeNode = { t: n.t };
  if (n.e) Object.assign(node, { e: n.e, verified: false });
  if (n.n) node.n = n.n;
  if (raw.MF[n.t] && cat) node.category = cat;
  if (n.k1) node.major = true;
  if (n.v) node.vertical = true;
  const hideAt = [...(!n.root && s ? [1 as const] : []), ...(!n.root && v ? [2 as const] : [])];
  if (hideAt.length) node.hideAt = hideAt;
  if (n.c) node.c = n.c.map((c) => toTree(c, cat));
  return node;
}
const tree = toTree(raw.M);

// ---------------------------------------------------------------------------------------------
// 9. Extras: ruler (R), turuq table (T), rank teach card (from lshow + gOrder).
const ruler: RulerRow[] = raw.R.map(([label, fixed, optional, r, w]) => ({
  label,
  fixed,
  optional,
  category: catOf(r)!,
  tariq: w === 'ش' || w === 'ط' ? w : 'both',
}));
const turuq: TuruqRow[] = raw.T.map(([name, shatibiyya, tayyiba, note]) => ({
  name,
  shatibiyya,
  tayyiba,
  note,
}));

const teachR =
  /it\.ty==='teachR'\)\{[\s\S]*?<h3 class="tn">([^<]+)<\/h3><div class="ex">([^<]+)<\/div>[\s\S]*?<\/ol><p>([^<]+)<\/p>\s*<div class="facts">([\s\S]*?)<\/div><div class="act">/.exec(
    lshowSource,
  );
if (!teachR) throw new Error('rank teach card not found in lshow()');
const facts = [...teachR[4]!.matchAll(/<div><small>([^<]+)<\/small>([^<]+)<\/div>/g)].map((m) => ({
  label: m[1]!,
  text: m[2]!,
}));
type Gen = (...a: unknown[]) => { q: string; w?: string; x?: [string, string]; opts?: string[] };
const gen = (name: string) => raw[name] as Gen;
const order = gen('gOrder')();
const rankCard = {
  title: teachR[1]!,
  verse: teachR[2]!,
  body: teachR[3]!,
  facts,
  explain: order.w!,
  example: { ...splitExample(order.x![0]), note: order.x![1], verified: false },
};

// ---------------------------------------------------------------------------------------------
// 10. Prompt templates: run each generator on a placeholder concept and read back its wording.
const P = {
  id: 'p',
  u: 1,
  f: 'a',
  n: '{name}',
  r: '{rule}',
  m: '{amount}',
  h: '{ruling}',
  ex: [['{ex}', '{note}']],
  d: ['', '{blank}', ''],
};
const Other = { ...P, id: 'o', n: '{value}', m: '{value}', d: ['', '{x}', ''] };
const pool = [
  P,
  Other,
  { ...Other, id: 'o2', n: 'o2', m: 'o2', d: ['', 'o2', ''] },
  { ...Other, id: 'o3', n: 'o3', m: 'o3', d: ['', 'o3', ''] },
];
const hokm = gen('gHokm')(P);
const prompts: Prompts = {
  classify: gen('gClassify')(P, pool).q,
  amount: gen('gAmount')(P).q,
  ruling: hokm.q,
  rulingExplain: hokm.w!.replace('{name} حكمه {ruling}. ', '').replace(/^\(|\)$/g, ''),
  tfAmount: gen('gTF')(P).q.replace(/: .*$/, ': {value}'),
  tfConcept: gen('gTF2')(P).q.replace(/: .*$/, ': {value}'),
  fill: gen('gFill')(P).q,
  match: gen('gMatch')([P, Other]).q,
  order: order.q,
  spot: gen('gSpot')({ t: '{title}', f: 'a' }).q,
};

// ---------------------------------------------------------------------------------------------
const madd: Module = plain({
  id: 'madd',
  title: (raw.M.t as string) ?? 'المد',
  rulings: hokm.opts!,
  prompts,
  rank: raw.RANK,
  categories,
  concepts,
  units,
  lessons,
  tree,
  questions,
  spot,
  extras: { ruler, turuq, rankCard },
});

const files = emitModule(root('src/content/modules/madd'), madd);
console.log(
  `extracted: ${concepts.length} concepts · ${lessons.length} lessons · ${questions.length} questions · ` +
    `${spot.length} spot · ${units.length} units / ${units.reduce((n, u) => n + u.lessons.length, 0)} nodes · ` +
    `${ruler.length} ruler rows · ${turuq.length} turuq rows → ${files.length} files`,
);
