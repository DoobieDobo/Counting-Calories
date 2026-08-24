/**
 * Small seeded RNG so a "roll" can be replayed and tested deterministically.
 * mulberry32 — tiny, fast, good enough for picking a dish off a menu.
 */

export type Rng = () => number

export function makeRng(seed: number): Rng {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick<T>(items: readonly T[], rng: Rng = Math.random): T | undefined {
  if (items.length === 0) return undefined
  return items[Math.floor(rng() * items.length)]
}

/**
 * Rolls for a new item, avoiding the one already showing so a re-roll always
 * visibly changes something. Falls back to any item when there's no alternative.
 */
export function pickExcluding<T>(
  items: readonly T[],
  exclude: T | undefined,
  rng: Rng = Math.random,
): T | undefined {
  const pool = exclude === undefined ? items : items.filter((i) => i !== exclude)
  return pick(pool.length > 0 ? pool : items, rng)
}
