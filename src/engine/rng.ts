/** A random source in [0, 1). Always seeded in tests; the UI seeds from the clock. */
export type Rng = () => number;

/** Small seeded PRNG (mulberry32) — deterministic sessions in tests and replays. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates shuffle with the given random source (returns a copy). */
export function shuffle<T>(items: readonly T[], rnd: Rng): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** One random element, or undefined for an empty list. */
export function pick<T>(items: readonly T[], rnd: Rng): T | undefined {
  return items.length ? items[Math.floor(rnd() * items.length)] : undefined;
}

/** Integer in [min, max], both inclusive. */
export function between(min: number, max: number, rnd: Rng): number {
  return min + Math.floor(rnd() * (max - min + 1));
}
