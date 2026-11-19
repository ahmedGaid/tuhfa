/** Settings (goal, sound, teacher mode, theme) + the one-time welcome flag. */
import { computed, effect } from '@preact/signals';
import { progress } from './progress.ts';
import type { Settings } from './schema.ts';

export const settings = computed(() => progress.value.settings);

export function updateSettings(patch: Partial<Settings>): void {
  const p = progress.value;
  progress.value = { ...p, settings: { ...p.settings, ...patch } };
}

export function markWelcomeSeen(): void {
  if (!progress.value.seenWelcome) progress.value = { ...progress.value, seenWelcome: true };
}

/** `data-theme` on <html>: absent = follow the system (theme.css). */
export function applyTheme(): void {
  effect(() => {
    const theme = settings.value.theme;
    const root = document.documentElement;
    if (theme === 'auto') delete root.dataset.theme;
    else root.dataset.theme = theme;
  });
}
