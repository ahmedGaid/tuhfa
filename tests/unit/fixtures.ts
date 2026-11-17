/**
 * Test-only helpers. `allVerified` pretends every Quran string is verified so the engine can be
 * tested at full size before the founder's review. It is NEVER used by the app.
 */
import { ModuleSchema, type Module, type ParsedModule, type TreeNode } from '../../src/content/schema.ts';
import madd from '../../src/content/modules/madd/index.ts';
import template from '../../src/content/modules/_template/index.ts';

const REF = { sura: 1, aya: 1 };

function verifyTree(n: TreeNode): TreeNode {
  return { ...n, ...(n.e ? { verified: true, ref: n.ref ?? REF } : {}), c: n.c?.map(verifyTree) };
}

export function allVerified(m: Module): ParsedModule {
  const v = <T extends { verified: boolean; ref?: unknown }>(x: T): T => ({
    ...x,
    verified: true,
    ref: x.ref ?? REF,
  });
  return ModuleSchema.parse({
    ...m,
    concepts: m.concepts.map((c) => ({ ...c, examples: c.examples.map(v) })),
    questions: m.questions?.map((q) => ({ ...q, example: v(q.example) })),
    spot: m.spot?.map(v),
    tree: verifyTree(m.tree),
    extras: m.extras && {
      ...m.extras,
      rankCard: m.extras.rankCard && { ...m.extras.rankCard, example: v(m.extras.rankCard.example) },
    },
  });
}

export const maddParsed: ParsedModule = ModuleSchema.parse(madd);
export const maddFull: ParsedModule = allVerified(madd);
export const templateParsed: ParsedModule = ModuleSchema.parse(template);

/** Every Quran string the real data marks verified (what the app may show). */
export function verifiedStrings(m: ParsedModule): Set<string> {
  const s = new Set<string>();
  m.concepts.forEach((c) => c.examples.forEach((e) => e.verified && s.add(e.quran)));
  m.questions?.forEach((q) => q.example.verified && s.add(q.example.quran));
  m.spot?.forEach((x) => x.verified && s.add(x.ayah));
  if (m.extras?.rankCard?.example.verified) s.add(m.extras.rankCard.example.quran);
  const walk = (n: TreeNode) => {
    if (n.e && n.verified) s.add(n.e);
    n.c?.forEach(walk);
  };
  walk(m.tree);
  return s;
}

export const lessonsOf = (m: ParsedModule) => m.units.flatMap((u) => u.lessons);
