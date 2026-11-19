/**
 * The module's book tree, read mode (T052). Zoom buttons (− / + / fit) and its own scroll box: the
 * tree scrolls sideways inside the box, never the page. Quran examples show only when verified.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ParsedModule, TreeNode } from '../../content/schema.ts';
import { catStyle } from '../modules.ts';
import { t } from '../strings.ar.ts';
import './TreeView.css';

const MIN = 0.35;
const MAX = 1.4;
const STEP = 0.1;

export function TreeView({ module }: { module: ParsedModule }) {
  const scroller = useRef<HTMLDivElement>(null);
  const org = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  const fit = () => {
    const sc = scroller.current;
    const o = org.current;
    if (!sc || !o) return;
    o.style.zoom = '1';
    const z = Math.min(1, Math.max(MIN, (sc.clientWidth - 20) / o.scrollWidth));
    o.style.zoom = String(z);
    setZoom(z);
    sc.scrollLeft = 0;
  };
  // start fitted to the screen, like the prototype
  useEffect(fit, []);

  const by = (d: number) => setZoom((z) => Math.min(MAX, Math.max(MIN, Math.round((z + d) * 100) / 100)));

  return (
    <figure class="tree" aria-label={t.library.tree}>
      <div class="tree__bar">
        <button
          type="button"
          class="tree__z"
          onClick={() => by(-STEP)}
          disabled={zoom <= MIN}
          aria-label={t.library.zoomOut}
        >
          −
        </button>
        <button
          type="button"
          class="tree__z"
          onClick={() => by(STEP)}
          disabled={zoom >= MAX}
          aria-label={t.library.zoomIn}
        >
          +
        </button>
        <button type="button" class="tree__z tree__z--fit" onClick={fit}>
          {t.library.fit}
        </button>
      </div>
      <div class="tree__scroll" ref={scroller} tabIndex={0}>
        <div class="org" ref={org} style={{ zoom: String(zoom) }}>
          <ul>
            <li>
              <Node module={module} node={module.tree} root />
            </li>
          </ul>
        </div>
      </div>
    </figure>
  );
}

function Node({ module, node, root = false }: { module: ParsedModule; node: TreeNode; root?: boolean }) {
  const cat = node.category ? module.categories.find((c) => c.id === node.category) : undefined;
  const cls = ['bx', root && 'bx--root', node.major && 'bx--major', cat && 'bx--cat']
    .filter(Boolean)
    .join(' ');
  return (
    <>
      <div class={cls} style={catStyle(module, node.category)}>
        {cat && node.major && (
          <span class="bx__icon" aria-hidden="true">
            {cat.icon}
          </span>
        )}
        {node.t}
        {node.e && node.verified && (
          <span class="bx__e quran" lang="ar">
            {node.e}
          </span>
        )}
        {node.n && <small>{node.n}</small>}
      </div>
      {node.c && (
        <ul class={node.vertical ? 'v' : undefined}>
          {node.c.map((c, i) => (
            <li key={i}>
              <Node module={module} node={c} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
