/** «حسابي» settings (T045): daily goal, sound, teacher mode, theme. */
import type { Goal, Theme } from '../../state/schema.ts';
import { settings, updateSettings } from '../../state/settings.ts';
import { num } from '../format.ts';
import { t } from '../strings.ar.ts';
import './Settings.css';

const GOALS: Goal[] = [20, 50, 100];
const THEMES: Theme[] = ['auto', 'light', 'dark'];

/** The settings block of «حسابي» (Profile renders the facts and data around it). */
export function Settings() {
  const s = settings.value;
  return (
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
