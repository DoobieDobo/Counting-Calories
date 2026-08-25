/**
 * Saved runs outlive the code that wrote them, so the validator is the only
 * thing standing between a stale payload and a subtly wrong game. These tests
 * exist because that gap was real: after recipes started scaling to the table,
 * a save from the previous build still passed validation, rehydrated with
 * `servings` undefined, and quietly restored the bug that release had fixed.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clear, initialGameState, load, save } from './persistence'
import { initialState, type GameState } from './gameReducer'
import type { Profile } from '../engine/calories'

const KEY = 'counting-calories:run:v2'
const OLD_KEY = 'counting-calories:run:v1'

/** Minimal in-memory localStorage, since these tests run under node. */
function installStorage(): Map<string, string> {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  })
  return store
}

const profile: Profile = {
  name: 'Kay',
  heightCm: 170,
  weightKg: 70,
  age: 30,
  sex: 'male',
  activity: 'light',
  goal: 'maintain',
}

const player = {
  id: 'player-1',
  profile,
  target: { bmr: 1600, tdee: 2200, target: 2200, floored: false, floor: 1500 },
}

function coopRun(overrides: Partial<GameState> = {}): GameState {
  return {
    ...initialState,
    phase: 'store',
    mode: 'coop',
    players: [player, { ...player, id: 'player-2' }],
    mealIndex: 0,
    banked: 0,
    history: [],
    current: {
      slot: 'breakfast',
      menuId: 'breakfast',
      dishId: 'tapsilog',
      slotIndex: 1,
      choices: { tapa: 'beef-tapa-120g' },
      budget: 1172,
      servings: 2,
    },
    ...overrides,
  }
}

let store: Map<string, string>
beforeEach(() => {
  store = installStorage()
})

describe('round trip', () => {
  it('saves and restores a run in progress', () => {
    const run = coopRun()
    save(run)
    expect(load()).toEqual(run)
  })

  it('starts fresh when nothing is stored', () => {
    expect(load()).toBeNull()
    expect(initialGameState()).toEqual(initialState)
  })

  it('clear() wipes the saved run', () => {
    save(coopRun())
    clear()
    expect(load()).toBeNull()
  })
})

describe('rejecting stale saves', () => {
  it('refuses a run with no servings — the pre-scaling shape', () => {
    // Exactly what a save from before the servings fix looks like.
    const stale = coopRun()
    const currentWithoutServings = { ...stale.current! } as Record<string, unknown>
    delete currentWithoutServings.servings
    store.set(KEY, JSON.stringify({ ...stale, current: currentWithoutServings }))

    expect(load()).toBeNull()
    expect(initialGameState()).toEqual(initialState)
  })

  it('refuses a finished meal with no servings', () => {
    const withHistory = coopRun({
      history: [
        {
          slot: 'breakfast',
          dishId: 'tapsilog',
          dishName: 'Tapsilog',
          dishEmoji: '🍳',
          choices: {},
          totals: { kcal: 500, protein: 30, carbs: 40, fat: 20 },
          budget: 600,
          verdict: {
            kcal: 500,
            budget: 600,
            remaining: 100,
            usage: 0.83,
            overBudget: false,
            grade: 'B',
            split: { protein: 0.3, carbs: 0.4, fat: 0.3 },
            notes: [],
          },
        } as never,
      ],
    })
    store.set(KEY, JSON.stringify(withHistory))
    expect(load()).toBeNull()
  })

  it('discards data left under a retired key instead of reading it', () => {
    store.set(OLD_KEY, JSON.stringify(coopRun()))
    expect(load()).toBeNull()
    expect(store.has(OLD_KEY)).toBe(false)
  })

  it('refuses a run pointing at a dish this build no longer ships', () => {
    store.set(KEY, JSON.stringify(coopRun({ current: { ...coopRun().current!, dishId: 'gone' } })))
    expect(load()).toBeNull()
  })

  it('refuses a meal index outside the run', () => {
    store.set(KEY, JSON.stringify(coopRun({ mealIndex: 9 })))
    expect(load()).toBeNull()
  })

  it('still loads a profile saved before dietary concerns existed', () => {
    // `avoid` is optional precisely so an older save stays playable; it must
    // read as "no concerns", not as a reason to throw the run away.
    const older = coopRun()
    const profileWithoutAvoid = { ...older.players[0]!.profile } as Record<string, unknown>
    delete profileWithoutAvoid.avoid
    store.set(
      KEY,
      JSON.stringify({
        ...older,
        players: [{ ...older.players[0]!, profile: profileWithoutAvoid }],
      }),
    )
    const loaded = load()
    expect(loaded).not.toBeNull()
    expect(loaded!.players[0]!.profile.avoid).toBeUndefined()
  })

  it('still loads a run saved before three-day blocks existed', () => {
    // Unlike `servings`, an absent `days` is honestly empty: a save from that
    // build really had no completed days. It must read as none, not as a
    // reason to bin the run — and never as undefined, which the day summary
    // and the report both count.
    const older = { ...coopRun() } as Record<string, unknown>
    delete older.days
    store.set(KEY, JSON.stringify(older))

    const loaded = load()
    expect(loaded).not.toBeNull()
    expect(loaded!.days).toEqual([])
  })

  it('refuses a completed day that is missing its verdict', () => {
    store.set(KEY, JSON.stringify(coopRun({ days: [{ meals: [] }] as never })))
    expect(load()).toBeNull()
  })

  it('refuses a report with no days behind it', () => {
    // The report reads straight from the block; restoring it empty would put
    // the player on a screen with nothing to show.
    store.set(KEY, JSON.stringify(coopRun({ phase: 'plan-report', days: [] })))
    expect(load()).toBeNull()

    const withoutDays = { ...coopRun({ phase: 'plan-report' }) } as Record<string, unknown>
    delete withoutDays.days
    store.set(KEY, JSON.stringify(withoutDays))
    expect(load()).toBeNull()
  })

  it('refuses malformed JSON rather than throwing', () => {
    store.set(KEY, '{not json')
    expect(load()).toBeNull()
  })

  it('refuses a payload that is not an object', () => {
    store.set(KEY, '"a string"')
    expect(load()).toBeNull()
  })
})

describe('hostile storage', () => {
  it('survives localStorage throwing on write', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
      removeItem: () => {},
    })
    expect(() => save(coopRun())).not.toThrow()
  })

  it('survives localStorage throwing on read', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {},
      removeItem: () => {},
    })
    expect(load()).toBeNull()
    expect(initialGameState()).toEqual(initialState)
  })

  it('survives localStorage throwing on clear', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {
        throw new Error('SecurityError')
      },
    })
    expect(() => clear()).not.toThrow()
  })
})
