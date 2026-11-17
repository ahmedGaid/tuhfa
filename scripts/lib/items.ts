/**
 * Every place a module holds Quran text, as one flat list with stable ids. locate-ayah,
 * verify-quran and content-notes all walk the module through this, so they agree on what
 * "an item" is.
 */
import type { Module, Ref, TreeNode } from '../../src/content/schema.ts';
import { spotWords } from '../../src/engine/spot.ts';
import { looseKey } from './quran.ts';

export type ItemKind = 'example' | 'question' | 'spot' | 'tree' | 'rank' | 'library';

export interface QuranItem {
  /** stable id, e.g. `concepts/tab/examples/0`, `spot/s01`, `lessons/3/q/1` */
  id: string;
  kind: ItemKind;
  /** human context for the notes file */
  context: string;
  quran: string;
  label?: string | undefined;
  note?: string | undefined;
  ref?: Ref | undefined;
  /** library spans have no flag: they are reported, not hidden */
  verified?: boolean | undefined;
  /** write a confirmed ref (and the exact Tanzil text, if it differs) back into the module */
  set(ref: Ref, tanzil: string): void;
}

interface Holder {
  quran: string;
  label?: string | undefined;
  note?: string | undefined;
  ref?: Ref | undefined;
  verified?: boolean | undefined;
}

/** Replace the Quran part inside a display label so the label never keeps old orthography. */
const relabel = (h: Holder, tanzil: string) => {
  if (h.label && h.quran !== tanzil) h.label = h.label.replace(h.quran, tanzil);
};

function holderItem(id: string, kind: ItemKind, context: string, h: Holder): QuranItem {
  return {
    id,
    kind,
    context,
    quran: h.quran,
    label: h.label,
    note: h.note,
    ref: h.ref,
    verified: h.verified,
    set(ref, tanzil) {
      relabel(h, tanzil);
      h.quran = tanzil;
      h.ref = ref;
      h.verified = true;
    },
  };
}

const QT = /<q-t>([\s\S]*?)<\/q-t>/g;

export function quranItems(m: Module): QuranItem[] {
  const out: QuranItem[] = [];
  for (const c of m.concepts) {
    c.examples.forEach((e, i) =>
      out.push(holderItem(`concepts/${c.id}/examples/${i}`, 'example', c.name, e)),
    );
  }
  for (const q of m.questions ?? []) {
    out.push(holderItem(`questions/${q.id}/example`, 'question', q.prompt, q.example));
  }
  if (m.extras?.rankCard) {
    out.push(
      holderItem('extras/rankCard/example', 'rank', m.extras.rankCard.title, m.extras.rankCard.example),
    );
  }
  for (const s of m.spot ?? []) {
    out.push({
      id: `spot/${s.id}`,
      kind: 'spot',
      context: s.title,
      quran: s.ayah,
      note: s.note,
      ref: s.ref,
      verified: s.verified,
      set(ref, tanzil) {
        // New text may split differently (pause marks, rasm): re-find each expected word in order.
        const words = spotWords(tanzil).map((w) => looseKey(w).key);
        let from = 0;
        const answer = s.expectWords.map((w) => {
          const i = words.indexOf(looseKey(w).key, from);
          if (i === -1) throw new Error(`spot/${s.id}: "${w}" not found in the Tanzil text`);
          from = i + 1;
          return i;
        });
        s.ayah = tanzil;
        s.answer = answer;
        s.ref = ref;
        s.verified = true;
      },
    });
  }
  const walk = (n: TreeNode, path: string) => {
    if (n.e) {
      const h = n as TreeNode & { e: string };
      out.push({
        id: `tree/${path}`,
        kind: 'tree',
        context: n.t,
        quran: h.e,
        note: n.n,
        ref: n.ref,
        verified: n.verified,
        set(ref, tanzil) {
          h.e = tanzil;
          h.ref = ref;
          h.verified = true;
        },
      });
    }
    n.c?.forEach((c, i) => walk(c, path ? `${path}.${i}` : String(i)));
  };
  walk(m.tree, '');
  m.lessons.forEach((l, li) => {
    let k = 0;
    for (const match of l.html.matchAll(QT)) {
      const old = match[1]!;
      out.push({
        id: `lessons/${li}/q/${k++}`,
        kind: 'library',
        context: l.title,
        quran: old,
        set(_ref, tanzil) {
          l.html = l.html.replace(`<q-t>${old}</q-t>`, `<q-t>${tanzil}</q-t>`);
        },
      });
    }
  });
  return out;
}
