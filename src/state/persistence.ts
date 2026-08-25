/**
 * Keeps a run alive across a page refresh.
 *
 * Stored state can outlive a change to the food data, so a rehydrated run is
 * validated before it is trusted — a dish that no longer exists, or an option
 * that has been renamed, drops the run back to a safe screen rather than
 * rendering a half-broken store.
 */

import { getDish } from '../data/dishes'
import { RUN_MEALS, initialState, type GameState } from './gameReducer'

/**
 * Bump this whenever the saved shape changes. A stale run that still passes
 * validation is worse than no run at all: when `servings` was added, v1 saves
 * rehydrated with it undefined, every consumer took the `= 1` default, and the
 * bug that release had just fixed came silently back.
 */
const KEY = 'counting-calories:run:v2'
const RETIRED_KEYS = ['counting-calories:run:v1']

export function save(state: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Private browsing, a full quota, or storage disabled entirely. Losing the
    // saved run is a much smaller problem than crashing the game over it.
  }
}

export function load(): GameState | null {
  try {
    for (const old of RETIRED_KEYS) localStorage.removeItem(old)
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isValid(parsed)) return null

    // A save from before three-day blocks has no completed days, and none is
    // exactly right — unlike `servings`, where a default quietly restored a bug.
    return { ...parsed, days: Array.isArray(parsed.days) ? parsed.days : [] }
  } catch {
    return null
  }
}

export function clear(): void {
  try {
    localStorage.removeItem(KEY)
    for (const old of RETIRED_KEYS) localStorage.removeItem(old)
  } catch {
    // See save().
  }
}

function isValid(value: unknown): value is GameState {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Partial<GameState>

  if (typeof s.phase !== 'string' || typeof s.mode !== 'string') return false
  if (!Array.isArray(s.players) || !Array.isArray(s.history)) return false
  if (typeof s.mealIndex !== 'number' || typeof s.banked !== 'number') return false
  if (s.mealIndex < 0 || s.mealIndex >= RUN_MEALS.length) return false

  for (const player of s.players) {
    if (!player?.profile || !player?.target || typeof player.id !== 'string') return false
  }

  // A run pointing at a dish this build no longer ships would render an empty
  // store, so treat it as unrecoverable rather than partly restoring it.
  if (s.current) {
    if (s.current.dishId && !getDish(s.current.dishId)) return false
    if (typeof s.current.slotIndex !== 'number' || s.current.slotIndex < 0) return false
    if (typeof s.current.budget !== 'number') return false
    // Missing `servings` means a save from before recipes scaled to the table.
    // Resuming it would quietly restore the single-serving pricing bug.
    if (typeof s.current.servings !== 'number' || s.current.servings < 1) return false
  }
  for (const meal of s.history) {
    if (!meal?.dishId || !getDish(meal.dishId)) return false
    if (typeof meal.servings !== 'number' || meal.servings < 1) return false
  }

  // Completed days are absent in a save from before three-day blocks, which
  // load() fills in. Present but malformed is a different matter: the report
  // reads straight from them, so a half-formed day would render as one.
  if (s.days !== undefined) {
    if (!Array.isArray(s.days)) return false
    for (const day of s.days) {
      if (!day?.verdict || typeof day.target !== 'number') return false
      if (!Array.isArray(day.meals) || day.meals.length === 0) return false
      for (const meal of day.meals) {
        if (typeof meal?.servings !== 'number' || meal.servings < 1) return false
      }
    }
    // The report is the one screen that cannot render without them.
    if (s.phase === 'plan-report' && s.days.length === 0) return false
  } else if (s.phase === 'plan-report') {
    return false
  }

  return true
}

/** Starting state for the app: a saved run if there is a usable one. */
export function initialGameState(): GameState {
  return load() ?? initialState
}
