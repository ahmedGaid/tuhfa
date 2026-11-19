/**
 * Short generated sound effects (T044): no audio files, only WebAudio tones. Soft and brief — a
 * teacher's nod, not a game show (tuhfa-brand). Silent when the sound setting is off or audio fails.
 */
import { settings } from '../state/settings.ts';

export type Sfx = 'right' | 'wrong' | 'complete';

/** [frequency Hz, start s, length s] */
const NOTES: Record<Sfx, [number, number, number][]> = {
  right: [
    [660, 0, 0.12],
    [880, 0.09, 0.18],
  ],
  wrong: [
    [330, 0, 0.14],
    [262, 0.12, 0.22],
  ],
  complete: [
    [523, 0, 0.16],
    [659, 0.13, 0.16],
    [784, 0.26, 0.16],
    [1047, 0.39, 0.4],
  ],
};

let ctx: AudioContext | undefined;

export function sfx(kind: Sfx): void {
  if (!settings.value.sound) return;
  try {
    const AC =
      globalThis.AudioContext ??
      (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    const t0 = ctx.currentTime + 0.01;
    for (const [freq, start, len] of NOTES[kind]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = kind === 'wrong' ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + start);
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + len);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0 + start);
      osc.stop(t0 + start + len + 0.05);
    }
  } catch {
    /* audio is a nicety; never break the lesson over it */
  }
}
