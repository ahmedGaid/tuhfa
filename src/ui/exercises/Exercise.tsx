/** One exercise: kind tag + prompt, then the view for its mode. */
import type { ParsedModule } from '../../content/schema.ts';
import type { Answer, Item } from '../../engine/types.ts';
import { Badge } from '../components/ui.tsx';
import { catStyle } from '../modules.ts';
import { t } from '../strings.ar.ts';
import { Choice } from './Choice.tsx';
import { MapFill } from './MapFill.tsx';
import { Match } from './Match.tsx';
import { Order } from './Order.tsx';
import { Spot } from './Spot.tsx';
import { TrueFalse } from './TrueFalse.tsx';
import './exercises.css';

export function Exercise({
  module,
  item,
  locked,
  onAnswer,
}: {
  module: ParsedModule;
  item: Item;
  locked: boolean;
  onAnswer: (a: Answer) => void;
}) {
  const cat = module.categories.find((c) => c.id === item.category);
  const p = { module, locked, onAnswer };
  const prompt = item.prompt || (item.mode === 'map' ? t.ex.mapPrompt : '');
  return (
    <section
      class="ex"
      style={catStyle(module, item.category)}
      data-kind={item.kind}
      aria-labelledby="ex-prompt"
    >
      <Badge icon={cat?.icon} text={t.kinds[item.kind]} />
      <h2 id="ex-prompt" class="ex__prompt" tabIndex={-1}>
        {prompt}
      </h2>
      {item.mode === 'choice' && <Choice {...p} item={item} />}
      {item.mode === 'tf' && <TrueFalse {...p} item={item} />}
      {item.mode === 'match' && <Match {...p} item={item} />}
      {item.mode === 'order' && <Order {...p} item={item} />}
      {item.mode === 'spot' && <Spot {...p} item={item} />}
      {item.mode === 'map' && <MapFill {...p} item={item} />}
    </section>
  );
}
