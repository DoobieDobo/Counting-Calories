import { describe, expect, it } from 'vitest'
import { getDish } from '../data/dishes'
import { CATALOG } from '../data/products'
import { buildCart, cartTotals } from '../engine/cart'
import type { Profile } from '../engine/calories'
import {
  RUN_MEALS,
  dayTarget,
  gameReducer,
  initialState,
  mealPot,
  pickerFor,
  soleMenuFor,
  type Action,
  type GameState,
} from './gameReducer'

const profile = (over: Partial<Profile> = {}): Profile => ({
  name: 'Kay',
  heightCm: 175,
  weightKg: 82,
  age: 34,
  sex: 'male',
  activity: 'light',
  goal: 'maintain',
  ...over,
})

function run(actions: Action[], from: GameState = initialState): GameState {
  return actions.reduce(gameReducer, from)
}

const soloStart = (): GameState =>
  run([
    { type: 'SET_MODE', mode: 'solo' },
    { type: 'ADD_PLAYER', profile: profile() },
    { type: 'START_RUN' },
  ])

const coopStart = (): GameState =>
  run([
    { type: 'SET_MODE', mode: 'coop' },
    { type: 'ADD_PLAYER', profile: profile({ name: 'Kay' }) },
    { type: 'ADD_PLAYER', profile: profile({ name: 'Sam', weightKg: 58, heightCm: 162, sex: 'female' }) },
    { type: 'START_RUN' },
  ])

/** Plays a whole dish through, taking the cheapest option in each slot. */
function shopCheaply(state: GameState): GameState {
  let s = state
  for (let guard = 0; guard < 30; guard++) {
    if (s.phase !== 'store' || !s.current?.dishId) break
    const dish = getDish(s.current.dishId)!
    const slot = dish.slots[s.current.slotIndex]!
    const cheapest = slot.options.reduce((best, option) => {
      const p = CATALOG[option.productId]
      const q = CATALOG[best.productId]
      if (!p) return best
      if (!q) return option
      return p.kcal * (option.use.amount / p.basis.amount) <
        q.kcal * (best.use.amount / q.basis.amount)
        ? option
        : best
    })
    s = gameReducer(s, { type: 'CHOOSE_OPTION', slotId: slot.id, optionId: cheapest.id })
  }
  return s
}

describe('setup', () => {
  it('replaces the player when a solo profile is re-submitted', () => {
    const state = run([
      { type: 'SET_MODE', mode: 'solo' },
      { type: 'ADD_PLAYER', profile: profile() },
      { type: 'ADD_PLAYER', profile: profile({ name: 'Kay again' }) },
    ])
    expect(state.players).toHaveLength(1)
    expect(state.players[0]!.profile.name).toBe('Kay again')
  })

  it('seats each new co-op player at the table', () => {
    const state = run([
      { type: 'SET_MODE', mode: 'coop' },
      { type: 'ADD_PLAYER', profile: profile({ name: 'Kay' }) },
      { type: 'ADD_PLAYER', profile: profile({ name: 'Sam' }) },
    ])
    expect(state.players.map((p) => p.profile.name)).toEqual(['Kay', 'Sam'])
    expect(state.phase).toBe('roster')
  })

  it('switching mode clears the table, so co-op players never leak into a solo run', () => {
    const state = run([
      { type: 'SET_MODE', mode: 'coop' },
      { type: 'ADD_PLAYER', profile: profile() },
      { type: 'ADD_PLAYER', profile: profile() },
      { type: 'SET_MODE', mode: 'solo' },
    ])
    expect(state.players).toHaveLength(0)
  })

  it('refuses to start a run with nobody playing', () => {
    expect(run([{ type: 'START_RUN' }]).phase).toBe('welcome')
  })
})

describe('starting a meal', () => {
  it('skips the menu screen when a meal slot only has one menu', () => {
    // Breakfast is served by a single menu, so choosing from a list of one
    // would be pure friction.
    expect(soleMenuFor('breakfast')).toBe('breakfast')
    const state = soloStart()
    expect(state.phase).toBe('dish')
    expect(state.current?.menuId).toBe('breakfast')
  })

  it('shows the menu screen when there is a real choice', () => {
    expect(soleMenuFor('lunch')).toBeNull()
  })

  it('opens with the first meal and its share of the daily budget', () => {
    const state = soloStart()
    expect(state.current?.slot).toBe('breakfast')
    expect(state.current?.budget).toBe(mealPot(state.players, 'breakfast', 0))
    expect(state.mealIndex).toBe(0)
  })

  it('pools every player’s budget in co-op', () => {
    const state = coopStart()
    const [kay, sam] = state.players
    expect(dayTarget(state.players)).toBe(kay!.target.target + sam!.target.target)
    expect(state.current!.budget).toBeGreaterThan(
      mealPot([kay!], 'breakfast', 0),
    )
  })
})

describe('shopping', () => {
  it('advances one ingredient at a time and lands on the cart at the end', () => {
    let state = gameReducer(soloStart(), { type: 'CHOOSE_DISH', dishId: 'tapsilog' })
    const dish = getDish('tapsilog')!
    expect(state.phase).toBe('store')
    expect(state.current!.slotIndex).toBe(0)

    state = shopCheaply(state)
    expect(state.phase).toBe('cart')
    expect(Object.keys(state.current!.choices)).toHaveLength(dish.slots.length)
  })

  it('records a skip as null, distinct from an unreached slot', () => {
    let state = gameReducer(soloStart(), { type: 'CHOOSE_DISH', dishId: 'tapsilog' })
    const dish = getDish('tapsilog')!
    state = gameReducer(state, { type: 'CHOOSE_OPTION', slotId: dish.slots[0]!.id, optionId: null })
    expect(state.current!.choices[dish.slots[0]!.id]).toBeNull()
    expect(dish.slots[1]!.id in state.current!.choices).toBe(false)
  })

  it('lets the player jump back to an earlier ingredient and change it', () => {
    let state = gameReducer(soloStart(), { type: 'CHOOSE_DISH', dishId: 'tapsilog' })
    const dish = getDish('tapsilog')!
    state = shopCheaply(state)
    state = gameReducer(state, { type: 'GOTO_INGREDIENT', index: 1 })
    expect(state.phase).toBe('store')
    expect(state.current!.slotIndex).toBe(1)
    // The rest of the cart survives the detour.
    expect(state.current!.choices[dish.slots[0]!.id]).toBeTruthy()
  })

  it('clamps an out-of-range jump instead of rendering an empty shelf', () => {
    let state = gameReducer(soloStart(), { type: 'CHOOSE_DISH', dishId: 'tapsilog' })
    const dish = getDish('tapsilog')!
    state = gameReducer(state, { type: 'GOTO_INGREDIENT', index: 999 })
    expect(state.current!.slotIndex).toBe(dish.slots.length - 1)
    state = gameReducer(state, { type: 'GOTO_INGREDIENT', index: -5 })
    expect(state.current!.slotIndex).toBe(0)
  })

  it('starts a fresh cart when the player picks a different dish', () => {
    let state = gameReducer(soloStart(), { type: 'CHOOSE_DISH', dishId: 'tapsilog' })
    state = shopCheaply(state)
    state = gameReducer(state, { type: 'CHOOSE_DISH', dishId: 'pancakes' })
    expect(state.current!.choices).toEqual({})
    expect(state.current!.slotIndex).toBe(0)
  })
})

describe('checkout', () => {
  it('refuses an over-budget cart even if the UI somehow allows the click', () => {
    let state = gameReducer(soloStart(), { type: 'CHOOSE_DISH', dishId: 'tapsilog' })
    const dish = getDish('tapsilog')!
    // Take the most expensive option everywhere.
    for (const slot of dish.slots) {
      const priciest = slot.options.reduce((best, option) => {
        const p = CATALOG[option.productId]!
        const q = CATALOG[best.productId]!
        return p.kcal * (option.use.amount / p.basis.amount) >
          q.kcal * (best.use.amount / q.basis.amount)
          ? option
          : best
      })
      state = gameReducer(state, { type: 'CHOOSE_OPTION', slotId: slot.id, optionId: priciest.id })
    }
    const totals = cartTotals(buildCart(dish, state.current!.choices, CATALOG))
    expect(totals.kcal).toBeGreaterThan(state.current!.budget)

    const after = gameReducer(state, { type: 'CHECKOUT' })
    expect(after.phase).toBe('cart')
    expect(after.history).toHaveLength(0)
  })

  it('banks the unspent calories and rolls them into the next meal', () => {
    let state = gameReducer(soloStart(), { type: 'CHOOSE_DISH', dishId: 'tapsilog' })
    state = shopCheaply(state)
    const budget = state.current!.budget
    const spent = cartTotals(buildCart(getDish('tapsilog')!, state.current!.choices, CATALOG)).kcal

    state = gameReducer(state, { type: 'CHECKOUT' })
    expect(state.phase).toBe('meal-result')
    expect(state.banked).toBe(budget - spent)

    const baseLunch = mealPot(state.players, 'lunch', 0)
    state = gameReducer(state, { type: 'NEXT_MEAL' })
    expect(state.current!.slot).toBe('lunch')
    expect(state.current!.budget).toBe(baseLunch + (budget - spent))
  })

  it('finishes the run after the last meal', () => {
    let state = soloStart()
    for (let i = 0; i < RUN_MEALS.length; i++) {
      state = gameReducer(state, { type: 'CHOOSE_DISH', dishId: state.current!.slot === 'breakfast' ? 'tapsilog' : 'adobo' })
      state = shopCheaply(state)
      state = gameReducer(state, { type: 'CHECKOUT' })
      state = gameReducer(state, { type: 'NEXT_MEAL' })
    }
    expect(state.phase).toBe('day-result')
    expect(state.history).toHaveLength(RUN_MEALS.length)
    expect(state.current).toBeNull()
  })

  it('keeps the players but wipes the run on restart', () => {
    let state = gameReducer(soloStart(), { type: 'CHOOSE_DISH', dishId: 'tapsilog' })
    state = shopCheaply(state)
    state = gameReducer(state, { type: 'CHECKOUT' })
    state = gameReducer(state, { type: 'RESTART' })
    expect(state.players).toHaveLength(1)
    expect(state.history).toHaveLength(0)
    expect(state.banked).toBe(0)
    expect(state.phase).toBe('budget')
  })
})

describe('co-op picker', () => {
  it('rotates the picker with each ingredient', () => {
    let state = gameReducer(coopStart(), { type: 'CHOOSE_DISH', dishId: 'champorado' })
    const dish = getDish('champorado')!
    const first = pickerFor(state)
    expect(first?.profile.name).toBe('Kay')

    state = gameReducer(state, {
      type: 'CHOOSE_OPTION',
      slotId: dish.slots[0]!.id,
      optionId: dish.slots[0]!.options[0]!.id,
    })
    expect(pickerFor(state)?.profile.name).toBe('Sam')

    state = gameReducer(state, {
      type: 'CHOOSE_OPTION',
      slotId: dish.slots[1]!.id,
      optionId: dish.slots[1]!.options[0]!.id,
    })
    expect(pickerFor(state)?.profile.name).toBe('Kay')
  })

  it('has no picker in solo — there is nobody to pass the device to', () => {
    const state = gameReducer(soloStart(), { type: 'CHOOSE_DISH', dishId: 'tapsilog' })
    expect(pickerFor(state)).toBeNull()
  })
})
