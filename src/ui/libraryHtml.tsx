/**
 * Library lesson text → Preact nodes through an allow-list (T053). Nothing is injected as raw HTML:
 * unknown tags are unwrapped (their text kept), every attribute is dropped except a few known
 * classes, `<q-t>` becomes Quran-styled text, and the tree placeholder becomes a live component.
 * The prototype's «احفظ الخريطة» button block (`div.act`) is dropped: practice lives on the path.
 */
import type { ComponentChildren, VNode } from 'preact';
import { h } from 'preact';

const TAGS = new Set(['p', 'b', 'br', 'div', 'small', 'ul', 'li']);
const CLASSES = new Set(['ex', 'facts', 'tip']);

export interface Slots {
  /** replaces `<div class="mapwrap">` */
  tree?: () => VNode;
}

function convert(node: Node, slots: Slots, key: number): ComponentChildren {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return null;
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  const cls = el.getAttribute('class') ?? '';
  const kids = () => Array.from(el.childNodes, (c, i) => convert(c, slots, i));

  if (tag === 'q-t') return h('span', { key, class: 'quran lib__q', lang: 'ar' }, el.textContent);
  if (tag === 'div' && cls === 'mapwrap') return slots.tree ? h('div', { key }, slots.tree()) : null;
  if (tag === 'div' && cls === 'act') return null;
  if (tag === 'script' || tag === 'style' || tag === 'button') return null;
  if (!TAGS.has(tag)) return kids();
  const keep = CLASSES.has(cls) ? `lib__${cls}` : undefined;
  return h(tag, { key, class: keep }, ...(kids() as ComponentChildren[]));
}

export function renderLibraryHtml(html: string, slots: Slots = {}): ComponentChildren {
  const tpl = document.createElement('template');
  tpl.innerHTML = html; // inert: a <template> never runs scripts or loads images
  return Array.from(tpl.content.childNodes, (n, i) => convert(n, slots, i));
}
