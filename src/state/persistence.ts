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

const KEY = 'counting-calories:run:v1'

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
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function clear(): void {
  try {
    localStorage.removeItem(KEY)
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
  }
  for (const meal of s.history) {
    if (!meal?.dishId || !getDish(meal.dishId)) return false
  }

  return true
}

/** Starting state for the app: a saved run if there is a usable one. */
export function initialGameState(): GameState {
  return load() ?? initialState
}
