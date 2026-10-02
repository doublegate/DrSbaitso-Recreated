/**
 * Seeded pseudo-random numbers (mulberry32). The engine never touches
 * `Math.random`, so a seed fully determines every game.
 */

/** Returns a number in [0, 1) and the seed to use next time. */
export function nextRandom(seed: number): [number, number] {
  const nextSeed = (seed + 0x6d2b79f5) | 0;
  let t = nextSeed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, nextSeed];
}
