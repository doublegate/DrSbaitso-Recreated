/**
 * The engine's only source of randomness: a seeded mulberry32 generator whose
 * 32-bit state is carried in `SbaitsoState.rng`, so every random reply is
 * reproducible from the seed.
 */

/** One step of mulberry32: a value in [0, 1) and the next generator state. */
export function nextRandom(rng: number): [number, number] {
  const next = (rng + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}
