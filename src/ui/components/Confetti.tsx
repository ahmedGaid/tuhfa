/**
 * Lesson-complete confetti (T044) — the one place it is allowed (tuhfa-brand override of rule 10).
 * Pure CSS; hidden entirely under reduced motion. Pieces use the category colours, never green/red.
 */
import './Confetti.css';

const COLOURS = ['var(--cat-asli)', 'var(--cat-hamz)', 'var(--cat-sukun)', 'var(--cat-manawi)', 'var(--ink)'];
const PIECES = 28;

export function Confetti() {
  return (
    <div class="confetti" aria-hidden="true">
      {Array.from({ length: PIECES }, (_, i) => {
        // fixed pseudo-random spread so the burst looks the same on every render
        const x = (i * 37) % 100;
        const delay = ((i * 53) % 40) / 100;
        const drift = ((i * 29) % 60) - 30;
        const turn = ((i * 71) % 720) - 360;
        return (
          <i
            key={i}
            style={{
              '--x': `${x}%`,
              '--delay': `${delay}s`,
              '--drift': `${drift}px`,
              '--turn': `${turn}deg`,
              '--c': COLOURS[i % COLOURS.length]!,
            }}
          />
        );
      })}
    </div>
  );
}
