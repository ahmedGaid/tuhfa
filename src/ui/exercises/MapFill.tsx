/** «احفظ الخريطة» — choose a blank node, then its word from the bank (T036). Outline view. */
import { useState } from 'preact/hooks';
import { fitsBlank } from '../../engine/grade.ts';
import type { MapItem } from '../../engine/types.ts';
import { ProgressBar } from '../components/ui.tsx';
import { num } from '../format.ts';
import type { ParsedModule } from '../../content/schema.ts';
import { catStyle } from '../modules.ts';
import { t } from '../strings.ar.ts';
import { shakeClass, useShake, type ExerciseProps } from './shared.tsx';

export function MapFill({ module, item, locked, onAnswer }: ExerciseProps<MapItem>) {
  const blanks = item.nodes.filter((n) => n.blank).map((n) => n.id);
  const [filled, setFilled] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<string | null>(blanks[0] ?? null);
  const [mistakes, setMistakes] = useState(0);
  const [shaking, shake] = useShake();
  const open = blanks.filter((id) => !filled.has(id));
  const examples = item.level === 4;

  const choose = (word: string) => {
    if (!sel) return;
    if (fitsBlank(item, sel, word)) {
      const next = new Set(filled).add(sel);
      setFilled(next);
      const rest = blanks.filter((id) => !next.has(id));
      setSel(rest[0] ?? null);
      if (!rest.length) onAnswer({ mistakes });
    } else {
      setMistakes((m) => m + 1);
      shake(`b${word}`);
    }
  };

  // words still needed (a word may fill several blanks)
  const need = new Map<string, number>();
  open.forEach((id) => need.set(item.fills[id]!, (need.get(item.fills[id]!) ?? 0) + 1));

  const slot = (id: string, text: string, quran: boolean) =>
    filled.has(id) || locked ? (
      <span class={`map__fill${quran ? ' quran' : ''}`}>{item.fills[id] ?? text}</span>
    ) : (
      <button
        type="button"
        class={`map__blank${sel === id ? ' is-on' : ''}`}
        aria-pressed={sel === id}
        aria-label={t.ex.blankLabel}
        onClick={() => setSel(id)}
      >
        {t.ex.blank}
      </button>
    );

  return (
    <>
      <p class="ex__hint">{t.ex.mapHint}</p>
      <ProgressBar
        value={filled.size / blanks.length}
        label={t.ex.mapLeft(num(open.length), num(blanks.length))}
      />
      <ul class="map">
        {item.nodes.map((n) => (
          <li key={n.id} class="map__node" style={nodeStyle(module, n.category, n.depth)}>
            {n.blank && !examples ? slot(n.id, n.text, false) : <span class="map__t">{n.text}</span>}
            {n.blank && examples
              ? slot(n.id, n.quran ?? '', true)
              : n.quran && <span class="map__e quran">{n.quran}</span>}
          </li>
        ))}
      </ul>
      {!locked && open.length > 0 && (
        <div class="ex__chips map__bank" role="group" aria-label={t.ex.wordBank}>
          {item.bank
            .filter((w) => need.has(w))
            .map((w) => (
              <button
                key={w}
                type="button"
                class={`opt opt--chip${examples ? ' quran' : ''}${shakeClass(shaking, `b${w}`)}`}
                onClick={() => choose(w)}
              >
                {w}
                {need.get(w)! > 1 && <sup> ×{num(need.get(w)!)}</sup>}
              </button>
            ))}
        </div>
      )}
    </>
  );
}

/** A node's own colour only (`--node`): an uncategorised node must not borrow the exercise's `--cat`. */
function nodeStyle(
  module: ParsedModule,
  category: string | undefined,
  depth: number,
): Record<string, string> {
  const cat = catStyle(module, category)['--cat'];
  return { '--depth': String(depth), '--node': cat ?? 'transparent', '--cat': cat ?? 'var(--ink)' };
}
