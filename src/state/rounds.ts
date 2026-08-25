/**
 * Rounds you have finished, kept so the shopping list outlives the round.
 *
 * Deliberately its own storage key, separate from the run in `persistence.ts`.
 * That key gets bumped whenever the saved shape changes, and each bump throws
 * the run away on purpose — a half-played run carries arithmetic the new build
 * has moved on from. A *finished* round is not stale in that sense. It is a
 * record of what was cooked, and versioning it alongside the run is how the
 * first three rounds anyone played were lost.
 */

import type { CompletedDay, Mode, Player } from './gameReducer'

const KEY = 'counting-calories:rounds:v1'

/** Roughly 8 KB a round, so a dozen is about 100 KB of a ~5 MB budget. */
export const KEEP = 12

export interface SavedRound {
  id: string
  /** Epoch milliseconds, for ordering and for showing when it was cooked. */
  finishedAt: number
  days: CompletedDay[]
  /** Kept whole: the names head the shopping columns, the targets split them. */
  players: Player[]
  mode: Mode
}

/**
 * Readers subscribe so a write reaches them.
 *
 * React runs a child's effects before its parent's, so the sidebar was reading
 * the shelf before the provider had put the finished round on it: you would end
 * a round and see no "Saved rounds", which reads exactly like the bug this
 * whole thing exists to fix.
 */
const listeners = new Set<() => void>()

export function subscribeRounds(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Cached so `loadRounds()` returns the same array between writes. Callers
 * render off it, and a fresh array every read would loop them.
 */
let cache: SavedRound[] | null = null

function read(): SavedRound[] {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return (cache = [])
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return (cache = [])
    // One malformed round should cost you that round, not the whole shelf.
    return (cache = parsed.filter(isRound).sort((a, b) => b.finishedAt - a.finishedAt))
  } catch {
    return (cache = [])
  }
}

function write(rounds: SavedRound[]): void {
  const kept = rounds.slice(0, KEEP)
  cache = kept
  try {
    localStorage.setItem(KEY, JSON.stringify(kept))
  } catch {
    // Private browsing, a full quota, or storage switched off. Losing the
    // archive is a smaller problem than taking the game down with it.
  }
  for (const listener of listeners) listener()
}

function isRound(value: unknown): value is SavedRound {
  if (typeof value !== 'object' || value === null) return false
  const r = value as Partial<SavedRound>

  if (typeof r.id !== 'string' || typeof r.finishedAt !== 'number') return false
  if (!Array.isArray(r.players) || r.players.length === 0) return false
  if (!Array.isArray(r.days) || r.days.length === 0) return false

  for (const player of r.players) {
    if (!player?.profile || !player?.target || typeof player.id !== 'string') return false
  }
  for (const day of r.days) {
    if (!day?.verdict || typeof day.target !== 'number') return false
    if (!Array.isArray(day.meals) || day.meals.length === 0) return false
    // The shopping list rebuilds each meal's cart from these, so a meal with no
    // servings would price the whole round for one person.
    for (const meal of day.meals) {
      if (typeof meal?.servings !== 'number' || meal.servings < 1) return false
      if (typeof meal.dishId !== 'string') return false
    }
  }

  return true
}

/** Every finished round, newest first. */
export function loadRounds(): SavedRound[] {
  return read()
}

/**
 * Files a finished round, replacing any earlier copy of the same one.
 *
 * Upsert rather than append because the caller is a React effect: a re-render,
 * a StrictMode double-invoke or a reload while the report is open would
 * otherwise shelve the same round again and again.
 */
export function saveRound(round: SavedRound): void {
  if (!isRound(round)) return

  const all = read()
  const existing = all.find((r) => r.id === round.id)
  const rest = all.filter((r) => r.id !== round.id)

  // A round is finished once. The caller stamps the clock every time its effect
  // runs, so on a reload with the report open that would march the timestamp
  // forward and reshuffle the shelf under someone who only opened a page.
  const entry = existing ? { ...round, finishedAt: existing.finishedAt } : round

  write([entry, ...rest].sort((a, b) => b.finishedAt - a.finishedAt))
}

export function deleteRound(id: string): void {
  write(read().filter((r) => r.id !== id))
}

export function clearRounds(): void {
  cache = []
  try {
    localStorage.removeItem(KEY)
  } catch {
    // See write().
  }
  for (const listener of listeners) listener()
}

/**
 * Forgets what was read, for tests that swap `localStorage` underneath. The app
 * never needs it — every write goes through this module.
 */
export function resetRoundsCache(): void {
  cache = null
}
