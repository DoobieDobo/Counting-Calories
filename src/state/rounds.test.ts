/**
 * The archive exists because a finished round used to vanish the moment the
 * next one started. These tests are mostly about it not vanishing again.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDish } from '../data/dishes'
import { CATALOG } from '../data/products'
import { buildCart, cartTotals } from '../engine/cart'
import { dailyTarget, type Profile } from '../engine/calories'
import { gradeDay, gradeMeal } from '../engine/nutrition'
import type { CompletedDay, CompletedMeal, Player } from './gameReducer'
import {
  KEEP,
  clearRounds,
  deleteRound,
  loadRounds,
  resetRoundsCache,
  subscribeRounds,
  saveRound,
  type SavedRound,
} from './rounds'

const KEY = 'counting-calories:rounds:v1'

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
  heightCm: 175,
  weightKg: 82,
  age: 34,
  sex: 'male',
  activity: 'light',
  goal: 'maintain',
}

const player: Player = { id: 'p1', profile, target: dailyTarget(profile) }

function meal(dishId: string, slot: CompletedMeal['slot']): CompletedMeal {
  const dish = getDish(dishId)!
  const choices = Object.fromEntries(dish.slots.map((s) => [s.id, s.options[0]!.id]))
  const lines = buildCart(dish, choices, CATALOG, 1)
  const totals = cartTotals(lines)
  return {
    slot,
    dishId,
    dishName: dish.name,
    dishEmoji: dish.emoji,
    choices,
    totals,
    budget: 900,
    servings: 1,
    verdict: gradeMeal(lines, totals, 900),
  }
}

const day: CompletedDay = (() => {
  const meals = [meal('tapsilog', 'breakfast'), meal('adobo', 'lunch'), meal('adobo', 'dinner')]
  return { meals, target: 2400, verdict: gradeDay(meals, 2400) }
})()

function round(over: Partial<SavedRound> = {}): SavedRound {
  return { id: 'r1', finishedAt: 1_000, days: [day], players: [player], mode: 'solo', ...over }
}

let store: Map<string, string>
beforeEach(() => {
  store = installStorage()
  resetRoundsCache()
})

describe('round trip', () => {
  it('starts empty', () => {
    expect(loadRounds()).toEqual([])
  })

  it('files a round and reads it back whole', () => {
    const r = round()
    saveRound(r)
    expect(loadRounds()).toEqual([r])
  })

  it('keeps enough to rebuild the shopping list', () => {
    saveRound(round())
    const [back] = loadRounds()
    expect(back!.players[0]!.target.target).toBe(player.target.target)
    expect(back!.days[0]!.meals[0]!.servings).toBe(1)
    expect(Object.keys(back!.days[0]!.meals[0]!.choices).length).toBeGreaterThan(0)
  })

  it('hands back the newest first, whatever order they went in', () => {
    saveRound(round({ id: 'old', finishedAt: 100 }))
    saveRound(round({ id: 'new', finishedAt: 900 }))
    saveRound(round({ id: 'middle', finishedAt: 500 }))
    expect(loadRounds().map((r) => r.id)).toEqual(['new', 'middle', 'old'])
  })
})

describe('filing the same round twice', () => {
  it('replaces rather than duplicates', () => {
    // The caller is a React effect, so this happens on every re-render while
    // the report is open, and on every reload of a saved report.
    const r = round()
    saveRound(r)
    saveRound(r)
    saveRound(r)
    expect(loadRounds()).toHaveLength(1)
  })

  it('takes the newer contents but keeps when it was finished', () => {
    // The caller stamps the clock on every effect run, so re-filing must not
    // march the timestamp forward and reshuffle the shelf.
    saveRound(round({ finishedAt: 100 }))
    saveRound(round({ finishedAt: 999_999, mode: 'coop' }))
    const all = loadRounds()
    expect(all).toHaveLength(1)
    expect(all[0]!.mode).toBe('coop')
    expect(all[0]!.finishedAt).toBe(100)
  })

  it('does not let a re-file jump an older round up the list', () => {
    saveRound(round({ id: 'old', finishedAt: 100 }))
    saveRound(round({ id: 'new', finishedAt: 500 }))
    saveRound(round({ id: 'old', finishedAt: 900 })) // as a reload would
    expect(loadRounds().map((r) => r.id)).toEqual(['new', 'old'])
  })
})

describe('not growing without limit', () => {
  it(`keeps the newest ${KEEP} and drops the rest`, () => {
    for (let i = 0; i < KEEP + 5; i++) saveRound(round({ id: `r${i}`, finishedAt: i }))
    const all = loadRounds()
    expect(all).toHaveLength(KEEP)
    expect(all[0]!.id).toBe(`r${KEEP + 4}`)
    expect(all.map((r) => r.id)).not.toContain('r0')
  })
})

describe('deleting', () => {
  it('removes one and leaves the others', () => {
    saveRound(round({ id: 'a', finishedAt: 1 }))
    saveRound(round({ id: 'b', finishedAt: 2 }))
    deleteRound('a')
    expect(loadRounds().map((r) => r.id)).toEqual(['b'])
  })

  it('shrugs at an id that is not there', () => {
    saveRound(round({ id: 'a' }))
    deleteRound('nope')
    expect(loadRounds()).toHaveLength(1)
  })

  it('clears the lot', () => {
    saveRound(round({ id: 'a', finishedAt: 1 }))
    saveRound(round({ id: 'b', finishedAt: 2 }))
    clearRounds()
    expect(loadRounds()).toEqual([])
  })
})

describe('telling readers a round arrived', () => {
  /**
   * React runs a child's effects before its parent's, so the sidebar read the
   * shelf before the provider had put the finished round on it: you ended a
   * round and saw no "Saved rounds", which looks exactly like the bug the
   * archive exists to fix.
   */
  it('notifies on a save, a delete and a clear', () => {
    const seen: number[] = []
    const stop = subscribeRounds(() => seen.push(loadRounds().length))

    saveRound(round({ id: 'a', finishedAt: 1 }))
    saveRound(round({ id: 'b', finishedAt: 2 }))
    deleteRound('a')
    clearRounds()

    expect(seen).toEqual([1, 2, 1, 0])
    stop()
  })

  it('stops notifying once unsubscribed', () => {
    let calls = 0
    const stop = subscribeRounds(() => (calls += 1))
    saveRound(round({ id: 'a' }))
    stop()
    saveRound(round({ id: 'b', finishedAt: 5 }))
    expect(calls).toBe(1)
  })

  it('hands back the same array between writes, so a reader cannot loop', () => {
    saveRound(round())
    expect(loadRounds()).toBe(loadRounds())
  })
})

describe('bad data', () => {
  it('drops one malformed round without losing the good ones', () => {
    store.set(KEY, JSON.stringify([round({ id: 'good' }), { id: 'junk' }, null, 'nonsense']))
    expect(loadRounds().map((r) => r.id)).toEqual(['good'])
  })

  it('refuses a round whose meals lost their servings', () => {
    // Would price every ingredient for one person and quietly understate a
    // whole table's shopping list.
    const broken = round()
    const meals = broken.days[0]!.meals.map((m) => ({ ...m }) as Record<string, unknown>)
    delete meals[0]!.servings
    store.set(
      KEY,
      JSON.stringify([{ ...broken, days: [{ ...broken.days[0]!, meals }] }]),
    )
    expect(loadRounds()).toEqual([])
  })

  it('refuses a round with no days or no players', () => {
    store.set(KEY, JSON.stringify([round({ days: [] }), round({ id: 'b', players: [] })]))
    expect(loadRounds()).toEqual([])
  })

  it('never files a malformed round in the first place', () => {
    saveRound({ id: 'x' } as SavedRound)
    expect(loadRounds()).toEqual([])
  })

  it('survives malformed JSON', () => {
    store.set(KEY, '{not json')
    expect(loadRounds()).toEqual([])
  })

  it('survives a payload that is not a list', () => {
    store.set(KEY, JSON.stringify({ nope: true }))
    expect(loadRounds()).toEqual([])
  })
})

describe('hostile storage', () => {
  it('survives reads that throw', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {},
      removeItem: () => {},
    })
    expect(loadRounds()).toEqual([])
  })

  it('survives writes that throw', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
      removeItem: () => {},
    })
    expect(() => saveRound(round())).not.toThrow()
  })

  it('survives a clear that throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {
        throw new Error('SecurityError')
      },
    })
    expect(() => clearRounds()).not.toThrow()
  })
})
