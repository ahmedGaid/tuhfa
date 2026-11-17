/**
 * «احفظ الخريطة» — put words back into blank nodes of the module's tree from a word bank.
 * Levels: 1 = structure (hideAt 1), 2 = rule names (hideAt 2), 3 = any node, 4 = examples (verified).
 * Inside a lesson only a few nodes are blanked; from level 2 on, only the focus's branch is shown.
 */
import type { TreeNode } from '../../content/schema.ts';
import { shuffle } from '../rng.ts';
import type { Generator, MapItem, MapLevel, MapNode } from '../types.ts';

interface Flat {
  id: string;
  depth: number;
  node: TreeNode;
  category: string | undefined;
}

function flatten(n: TreeNode, id: string, depth: number, cat: string | undefined, out: Flat[]): Flat[] {
  const category = n.category ?? cat;
  out.push({ id, depth, node: n, category });
  n.c?.forEach((c, i) => flatten(c, `${id}.${i}`, depth + 1, category, out));
  return out;
}

const blankable: Record<MapLevel, (f: Flat) => boolean> = {
  1: (f) => !!f.node.hideAt?.includes(1),
  2: (f) => !!f.node.hideAt?.includes(2),
  3: (f) => f.depth > 0,
  4: (f) => !!f.node.e && !!f.node.verified,
};

export const map: Generator = {
  kind: 'map',
  build({ module, focus, level = 1, mapBlanks = 4 }, rng): MapItem | null {
    let flat = flatten(module.tree, '0', 0, undefined, []);
    if (level > 1 && focus) {
      // show the root and the top-level branch of the focus's category only
      const branch = flat.find((f) => f.depth === 1 && f.category === focus.category);
      if (branch)
        flat = flat.filter((f) => f.depth === 0 || f.id === branch.id || f.id.startsWith(`${branch.id}.`));
    }
    const pickable = flat.filter(blankable[level]);
    if (pickable.length < 2) return null;
    const blanks = new Set(
      shuffle(pickable, rng)
        .slice(0, Math.max(2, mapBlanks))
        .map((f) => f.id),
    );
    const fills: Record<string, string> = {};
    const nodes: MapNode[] = flat.map((f) => {
      const blank = blanks.has(f.id);
      const verifiedE = f.node.e && f.node.verified ? f.node.e : undefined;
      if (blank) fills[f.id] = level === 4 ? verifiedE! : f.node.t;
      return { id: f.id, depth: f.depth, text: f.node.t, quran: verifiedE, category: f.category, blank };
    });
    const answers = Object.values(fills);
    return {
      mode: 'map',
      kind: 'map',
      key: `map:${level}:${[...blanks].sort().join(',')}`,
      concept: focus?.id,
      category: focus?.category,
      prompt: module.prompts.map ?? '',
      level,
      nodes,
      fills,
      bank: shuffle([...new Set(answers)], rng),
      explain: '',
    };
  },
};
