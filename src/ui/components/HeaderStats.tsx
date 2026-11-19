/** Header stats (T043): streak flame + daily-goal ring. Ring stroke is ink (never green: feedback only). */
import { today } from '../../state/date.ts';
import { progress } from '../../state/progress.ts';
import { goalFill, shownStreak, xpOn } from '../../state/streak.ts';
import { num } from '../format.ts';
import { t } from '../strings.ar.ts';
import './HeaderStats.css';

export function Ring({ value, label, size = 32 }: { value: number; label: string; size?: number }) {
  const r = 12;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <svg class="ring" width={size} height={size} viewBox="0 0 32 32" role="img" aria-label={label}>
      <circle class="ring__track" cx="16" cy="16" r={r} />
      <circle
        class="ring__fill"
        cx="16"
        cy="16"
        r={r}
        stroke-dasharray={`${c * v} ${c}`}
        transform="rotate(-90 16 16)"
      />
      {v >= 1 && <path class="ring__check" d="M11 16.5l3.2 3 6-6.5" />}
    </svg>
  );
}

export function HeaderStats() {
  const p = progress.value;
  const day = today();
  const streak = shownStreak(p.streak, day);
  const xp = xpOn(p, day);
  const goal = p.settings.goal;
  return (
    <div class="hstats">
      <span class="hstats__streak" role="img" aria-label={t.header.streak(num(streak))}>
        <span aria-hidden="true" class={streak ? '' : 'hstats__cold'}>
          🔥
        </span>
        <span aria-hidden="true">{num(streak)}</span>
      </span>
      <Ring value={goalFill(xp, goal)} label={t.header.goal(num(xp), num(goal))} />
    </div>
  );
}
