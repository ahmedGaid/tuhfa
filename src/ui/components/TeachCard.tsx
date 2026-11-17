/** Teach cards (T034): a new concept before its exercises, and the module's rank card. */
import { useEffect, useRef } from 'preact/hooks';
import type { Concept, ParsedModule, RankCard } from '../../content/schema.ts';
import { catStyle } from '../modules.ts';
import { t } from '../strings.ar.ts';
import { Mascot } from './Mascot.tsx';
import { Badge, QuranText } from './ui.tsx';
import './TeachCard.css';

export function TeachCard({
  module,
  concept,
  onDone,
}: {
  module: ParsedModule;
  concept: Concept;
  onDone: () => void;
}) {
  const cat = module.categories.find((c) => c.id === concept.category);
  // verified examples only (FR-005), 2–3 of them
  const examples = concept.examples.filter((e) => e.verified).slice(0, 3);
  return (
    <article class="teach" style={catStyle(module, concept.category)} aria-labelledby="teach-title">
      <div class="teach__top">
        <Badge icon={cat?.icon} text={t.lesson.newCard} />
        <Mascot pose="idle" size={44} />
      </div>
      <h2 id="teach-title" class="teach__name">
        {concept.name}
      </h2>
      <p class="teach__rule">{concept.rule}</p>
      <dl class="teach__facts">
        <div>
          <dt>{t.lesson.amount}</dt>
          <dd>{concept.amount}</dd>
        </div>
        {concept.ruling && (
          <div>
            <dt>{t.lesson.ruling}</dt>
            <dd>{concept.ruling}</dd>
          </div>
        )}
      </dl>
      {examples.length ? (
        <ul class="teach__examples">
          {examples.map((e) => (
            <li key={e.quran}>
              <QuranText example={e} size="lg" />
              <small>{e.note}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p class="teach__pending">{t.lesson.examplesPending}</p>
      )}
      <GotIt onDone={onDone} />
    </article>
  );
}

export function RankCardView({ card, rank, onDone }: { card: RankCard; rank: string[]; onDone: () => void }) {
  return (
    <article class="teach" aria-labelledby="rank-title">
      <div class="teach__top">
        <Badge text={t.lesson.newCard} />
        <Mascot pose="stretch" stretch={3} size={36} />
      </div>
      <h2 id="rank-title" class="teach__name">
        {card.title}
      </h2>
      <blockquote class="teach__verse">{card.verse}</blockquote>
      <p class="teach__rule">{card.body}</p>
      <p class="teach__sub">{t.lesson.rankList}</p>
      <ol class="teach__rank">
        {rank.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ol>
      <dl class="teach__facts">
        {card.facts.map((f) => (
          <div key={f.label}>
            <dt>{f.label}</dt>
            <dd>{f.text}</dd>
          </div>
        ))}
      </dl>
      <GotIt onDone={onDone} />
    </article>
  );
}

/** «فهمت، يلا نتمرّن» — focused on mount so the card is keyboard-playable. */
function GotIt({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <button ref={ref} type="button" class="btn btn--primary teach__go" onClick={onDone}>
      {t.lesson.gotIt}
    </button>
  );
}
