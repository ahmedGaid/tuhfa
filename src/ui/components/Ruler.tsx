/**
 * Generic harakat ruler + tariq comparison table (T054), from a module's `extras`. الشاطبية = filled
 * dark badge, الطيبة = outlined badge (shape, not colour); a family colour travels with its icon.
 */
import type { ParsedModule, RulerRow, TuruqRow } from '../../content/schema.ts';
import { num } from '../format.ts';
import { catStyle } from '../modules.ts';
import { t } from '../strings.ar.ts';
import './Ruler.css';

export function TariqBadge({ tariq }: { tariq: RulerRow['tariq'] }) {
  if (tariq === 'ش') return <span class="tariq tariq--sh">{t.library.shatibiyya}</span>;
  if (tariq === 'ط') return <span class="tariq tariq--tb">{t.library.tayyiba}</span>;
  return <span class="tariq tariq--both">{t.library.both}</span>;
}

export function Ruler({ module, rows }: { module: ParsedModule; rows: RulerRow[] }) {
  return (
    <section class="tool" aria-labelledby="ruler-h">
      <h2 id="ruler-h">{t.library.ruler}</h2>
      <ul class="ruler">
        {rows.map((r, i) => {
          const cat = module.categories.find((c) => c.id === r.category);
          const value = r.optional ? `${num(r.fixed)} : ${num(r.fixed + r.optional)}` : num(r.fixed);
          return (
            <li key={i} class="ruler__row" style={catStyle(module, r.category)}>
              <span class="ruler__label">
                {cat && (
                  <span class="ruler__icon" aria-hidden="true">
                    {cat.icon}
                  </span>
                )}
                <b>{r.label}</b>
                <TariqBadge tariq={r.tariq} />
              </span>
              <span class="ruler__dots" role="img" aria-label={t.library.harakat(value)}>
                {Array.from({ length: r.fixed }, (_, j) => (
                  <i key={`f${j}`} />
                ))}
                {Array.from({ length: r.optional }, (_, j) => (
                  <i key={`o${j}`} class="is-opt" />
                ))}
                <span aria-hidden="true">{t.library.harakat(value)}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p class="tool__legend">{t.library.rulerLegend}</p>
    </section>
  );
}

export function TuruqTable({ rows }: { rows: TuruqRow[] }) {
  return (
    <section class="tool" aria-labelledby="turuq-h">
      <h2 id="turuq-h">{t.library.turuq}</h2>
      <div class="tool__scroll" tabIndex={0}>
        <table class="turuq">
          <thead>
            <tr>
              <th scope="col">{t.library.madd}</th>
              <th scope="col">
                <TariqBadge tariq="ش" />
              </th>
              <th scope="col">
                <TariqBadge tariq="ط" />
              </th>
              <th scope="col">{t.library.note}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <th scope="row">{r.name}</th>
                <td>{r.shatibiyya}</td>
                <td>{r.tayyiba}</td>
                <td class="turuq__note">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
