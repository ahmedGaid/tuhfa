/** «حسابي» tab (T045): a few facts + settings (daily goal, sound, teacher mode, theme). */
import { today } from '../../state/date.ts';
import { progress } from '../../state/progress.ts';
import type { Goal, Theme } from '../../state/schema.ts';
import { settings, updateSettings } from '../../state/settings.ts';
import { shownStreak } from '../../state/streak.ts';
import { num } from '../format.ts';
import { t } from '../strings.ar.ts';
import './Settings.css';

const GOALS: Goal[] = [20, 50, 100];
const THEMES: Theme[] = ['auto', 'light', 'dark'];

export function Settings() {
  const p = progress.value;
  const s = settings.value;
  return (
    <div class="me">
      <h1 class="me__title">{t.tabs.me}</h1>

      <section aria-labelledby="me-stats">
        <h2 id="me-stats" class="me__h">
          {t.settings.stats}
        </h2>
        <dl class="me__facts">
          <div>
            <dt>{t.settings.xpTotal}</dt>
            <dd>⭐ {num(p.xp.total)}</dd>
          </div>
          <div>
            <dt>{t.settings.streak}</dt>
            <dd>{num(shownStreak(p.streak, today()))}</dd>
          </div>
          <div>
            <dt>{t.settings.lessonsDone}</dt>
            <dd>{num(Object.keys(p.lessons).length)}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="me-settings" class="me__settings">
        <h2 id="me-settings" class="me__h">
          {t.settings.section}
        </h2>

        <fieldset class="me__group">
          <legend>{t.settings.goal}</legend>
          <div class="seg">
            {GOALS.map((g) => (
              <label class="seg__opt" key={g}>
                <input
                  type="radio"
                  name="goal"
                  checked={s.goal === g}
                  onChange={() => updateSettings({ goal: g })}
                />
                <span>
                  <b>{t.settings.goals[g]}</b>
                  <small>{t.settings.goalXp(num(g))}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Toggle label={t.settings.sound} checked={s.sound} onChange={(v) => updateSettings({ sound: v })} />
        <Toggle
          label={t.settings.teacher}
          hint={t.settings.teacherHint}
          checked={s.teacher}
          onChange={(v) => updateSettings({ teacher: v })}
        />

        <fieldset class="me__group">
          <legend>{t.settings.theme}</legend>
          <div class="seg">
            {THEMES.map((th) => (
              <label class="seg__opt" key={th}>
                <input
                  type="radio"
                  name="theme"
                  checked={s.theme === th}
                  onChange={() => updateSettings({ theme: th })}
                />
                <span>
                  <b>{t.settings.themes[th]}</b>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label class="toggle">
      <span class="toggle__text">
        <b>{label}</b>
        {hint && <small>{hint}</small>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange((e.currentTarget as HTMLInputElement).checked)}
      />
      <span class="toggle__track" aria-hidden="true" />
    </label>
  );
}
