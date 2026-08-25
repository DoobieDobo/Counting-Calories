import { describe, expect, it } from 'vitest'
import { dishesForMenu, getDish } from '../data/dishes'
import { CATALOG } from '../data/products'
import { buildCart, cartTotals } from '../engine/cart'
import type { Profile } from '../engine/calories'
import {
  PLAN_DAYS,
  RUN_MEALS,
  dayTarget,
  gameReducer,
  initialState,
  mealPot,
  mealShares,
  pickerFor,
  playerMealBudget,
  picksBefore,
  soleMenuFor,
  tableConcerns,
  turnsPerPlayer,
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

describe('a three-day block', () => {
  /** Plays every meal of one day and stops on the day summary. */
  function playDay(from: GameState): GameState {
    let state = from
    for (let i = 0; i < RUN_MEALS.length; i++) {
      state = gameReducer(state, {
        type: 'CHOOSE_DISH',
        dishId: state.current!.slot === 'breakfast' ? 'tapsilog' : 'adobo',
      })
      state = shopCheaply(state)
      state = gameReducer(state, { type: 'CHECKOUT' })
      state = gameReducer(state, { type: 'NEXT_MEAL' })
    }
    return state
  }

  it('banks each finished day and only reports after the third', () => {
    let state = playDay(soloStart())

    for (let day = 1; day <= PLAN_DAYS; day++) {
      expect(state.phase, `end of day ${day}`).toBe('day-result')
      state = gameReducer(state, { type: 'FINISH_DAY' })
      expect(state.days, `after finishing day ${day}`).toHaveLength(day)

      if (day < PLAN_DAYS) {
        // Straight back into the shop for the next day, with a clean slate.
        expect(state.phase, `start of day ${day + 1}`).not.toBe('plan-report')
        expect(state.history).toHaveLength(0)
        expect(state.banked).toBe(0)
        state = playDay(state)
      }
    }

    expect(state.phase).toBe('plan-report')
  })

  it('stores what each day cooked, so the report has something to show', () => {
    const state = gameReducer(playDay(soloStart()), { type: 'FINISH_DAY' })
    const day = state.days[0]!
    expect(day.meals).toHaveLength(RUN_MEALS.length)
    expect(day.target).toBe(dayTarget(state.players))
    expect(day.verdict.kcal).toBe(day.meals.reduce((sum, m) => sum + m.totals.kcal, 0))
  })

  it('reports again on the next block rather than stopping at three days', () => {
    let state = soloStart()
    for (let i = 0; i < PLAN_DAYS; i++) state = gameReducer(playDay(state), { type: 'FINISH_DAY' })
    expect(state.phase).toBe('plan-report')

    state = gameReducer(state, { type: 'RESTART' })
    expect(state.days).toHaveLength(0)

    state = gameReducer(state, { type: 'START_RUN' })
    for (let i = 0; i < PLAN_DAYS; i++) state = gameReducer(playDay(state), { type: 'FINISH_DAY' })
    expect(state.phase).toBe('plan-report')
    expect(state.days).toHaveLength(PLAN_DAYS)
  })

  it('ignores a finish with nothing cooked', () => {
    const start = soloStart()
    expect(gameReducer(start, { type: 'FINISH_DAY' })).toBe(start)
  })

  it('keeps the finished days when the day in progress is abandoned', () => {
    // Binning two good days because the third went wrong would be miserable.
    let state = gameReducer(playDay(soloStart()), { type: 'FINISH_DAY' })
    state = gameReducer(state, { type: 'CHOOSE_DISH', dishId: 'tapsilog' })
    state = shopCheaply(state)
    state = gameReducer(state, { type: 'CHECKOUT' })

    state = gameReducer(state, { type: 'ABANDON_DAY' })
    expect(state.days).toHaveLength(1)
    expect(state.history).toHaveLength(0)
    expect(state.mealIndex).toBe(0)
    expect(state.banked).toBe(0)
    expect(state.phase).not.toBe('plan-report')
  })

  it('clears the whole block on a restart, but keeps the players', () => {
    let state = gameReducer(playDay(soloStart()), { type: 'FINISH_DAY' })
    state = gameReducer(state, { type: 'RESTART' })
    expect(state.days).toHaveLength(0)
    expect(state.players).toHaveLength(1)
    expect(state.phase).toBe('budget')
  })

  it('never lets a changed table inherit days it did not eat', () => {
    // Going back to the roster and starting again used to keep the banked days
    // while every budget and every portion changed underneath them — the
    // shopping list would have been split across someone who was not there.
    let state = gameReducer(playDay(soloStart()), { type: 'FINISH_DAY' })
    expect(state.days).toHaveLength(1)

    state = gameReducer(state, { type: 'GOTO', phase: 'roster' })
    state = gameReducer(state, { type: 'ADD_PLAYER', profile: profile({ name: 'Sam' }) })
    state = gameReducer(state, { type: 'START_RUN' })

    expect(state.days).toHaveLength(0)
    expect(state.history).toHaveLength(0)
    expect(state.banked).toBe(0)
  })

  it('gives each round its own identity, so the archive cannot overwrite one', () => {
    const first = gameReducer(playDay(soloStart()), { type: 'FINISH_DAY' })
    const second = gameReducer(first, { type: 'RESTART' })
    const third = gameReducer(second, { type: 'START_RUN' })

    expect(second.roundId).not.toBe(first.roundId)
    expect(third.roundId).not.toBe(second.roundId)
  })

  it('keeps a round identity steady while it is being played', () => {
    // The archive upserts on it, so a shifting id would shelve a new copy of
    // the same round on every day played.
    const start = soloStart()
    const afterDay = playDay(start)
    expect(afterDay.roundId).toBe(start.roundId)
    expect(gameReducer(afterDay, { type: 'FINISH_DAY' }).roundId).toBe(start.roundId)
  })
})

describe('co-op servings', () => {
  it('cooks one portion per player', () => {
    expect(soloStart().current!.servings).toBe(1)
    expect(coopStart().current!.servings).toBe(2)
  })

  /**
   * The bug this guards: co-op pooled every player's calories into one pot but
   * still cooked a single portion, so a two-player meal had double the budget
   * and the same amount of food. Every result came in absurdly under budget and
   * the grading blamed the players for it.
   *
   * The invariant is that food and budget scale together — two identical
   * players making identical choices should land at the same proportion of
   * their budget as one player alone.
   */
  it('keeps the same budget usage as solo when the table doubles', () => {
    const twin = profile()

    let solo = run([
      { type: 'SET_MODE', mode: 'solo' },
      { type: 'ADD_PLAYER', profile: twin },
      { type: 'START_RUN' },
      { type: 'CHOOSE_DISH', dishId: 'tapsilog' },
    ])
    solo = shopCheaply(solo)
    solo = gameReducer(solo, { type: 'CHECKOUT' })

    let duo = run([
      { type: 'SET_MODE', mode: 'coop' },
      { type: 'ADD_PLAYER', profile: twin },
      { type: 'ADD_PLAYER', profile: twin },
      { type: 'START_RUN' },
      { type: 'CHOOSE_DISH', dishId: 'tapsilog' },
    ])
    duo = shopCheaply(duo)
    duo = gameReducer(duo, { type: 'CHECKOUT' })

    const soloMeal = solo.history[0]!
    const duoMeal = duo.history[0]!

    // Two identical players: double the budget, and now double the food.
    // Each line is rounded to a whole calorie, so doubling the portion and
    // doubling the rounded total can differ by a calorie per line — the point
    // is that they track, not that they match to the unit.
    expect(duoMeal.budget).toBe(soloMeal.budget * 2)
    expect(duoMeal.totals.kcal).toBeGreaterThan(soloMeal.totals.kcal * 2 - 10)
    expect(duoMeal.totals.kcal).toBeLessThan(soloMeal.totals.kcal * 2 + 10)

    // Which means the same share of the budget spent, and the same grade.
    expect(duoMeal.verdict.usage).toBeCloseTo(soloMeal.verdict.usage, 2)
    expect(duoMeal.verdict.grade).toBe(soloMeal.verdict.grade)

    // And the failure this replaces: before scaling, a two-player meal spent
    // half the share a solo one did.
    expect(duoMeal.verdict.usage).toBeGreaterThan(soloMeal.verdict.usage * 0.9)
  })

  it('records servings on the finished meal so the split is real', () => {
    let duo = gameReducer(coopStart(), { type: 'CHOOSE_DISH', dishId: 'tapsilog' })
    duo = shopCheaply(duo)
    duo = gameReducer(duo, { type: 'CHECKOUT' })
    expect(duo.history[0]!.servings).toBe(2)
  })
})

describe('dietary concerns across the table', () => {
  it('has none when nobody set any', () => {
    expect(tableConcerns(soloStart().players)).toEqual([])
  })

  it('takes the union, so one player’s allergy constrains the shared shelf', () => {
    const state = run([
      { type: 'SET_MODE', mode: 'coop' },
      { type: 'ADD_PLAYER', profile: profile({ name: 'Kay', avoid: ['shellfish'] }) },
      { type: 'ADD_PLAYER', profile: profile({ name: 'Sam', avoid: ['halal', 'shellfish'] }) },
    ])
    expect(tableConcerns(state.players).sort()).toEqual(['halal', 'shellfish'])
  })

  it('tolerates a player saved before the field existed', () => {
    const legacy = profile()
    delete (legacy as { avoid?: unknown }).avoid
    const state = run([
      { type: 'SET_MODE', mode: 'solo' },
      { type: 'ADD_PLAYER', profile: legacy },
    ])
    expect(tableConcerns(state.players)).toEqual([])
  })
})

describe('portions follow appetite, not headcount', () => {
  /** A big eater and a small one, so an equal split would be obviously wrong. */
  const unevenTable = (): GameState =>
    run([
      { type: 'SET_MODE', mode: 'coop' },
      { type: 'ADD_PLAYER', profile: profile({ name: 'Big', heightCm: 190, weightKg: 95, age: 25, sex: 'male', activity: 'athlete' }) },
      { type: 'ADD_PLAYER', profile: profile({ name: 'Small', heightCm: 155, weightKg: 48, age: 60, sex: 'female', activity: 'sedentary' }) },
      { type: 'START_RUN' },
    ])

  it('gives the bigger target the bigger plate', () => {
    const state = unevenTable()
    const [big, small] = mealShares(state.players, 'dinner', 1000)
    expect(big!.kcal).toBeGreaterThan(small!.kcal)
    // And in the same ratio as their budgets, not merely bigger.
    expect(big!.kcal / small!.kcal).toBeCloseTo(big!.budget / small!.budget, 1)
  })

  it('splits evenly when the targets happen to match', () => {
    const twins = run([
      { type: 'SET_MODE', mode: 'coop' },
      { type: 'ADD_PLAYER', profile: profile({ name: 'A' }) },
      { type: 'ADD_PLAYER', profile: profile({ name: 'B' }) },
      { type: 'START_RUN' },
    ])
    const shares = mealShares(twins.players, 'dinner', 900)
    expect(shares.map((s) => s.kcal)).toEqual([450, 450])
  })

  it('always adds back up to exactly what was cooked', () => {
    // Largest-remainder rounding: naive rounding drops or invents calories,
    // which reads as a bug on something presented as a receipt.
    const state = unevenTable()
    for (const total of [0, 1, 7, 333, 998, 1001, 2500]) {
      const shares = mealShares(state.players, 'dinner', total)
      expect(shares.reduce((sum, s) => sum + s.kcal, 0), `total ${total}`).toBe(total)
    }
  })

  it('adds up across a full six-player table too', () => {
    let state = run([{ type: 'SET_MODE', mode: 'coop' }])
    for (let i = 0; i < 6; i++) {
      state = gameReducer(state, {
        type: 'ADD_PLAYER',
        profile: profile({ name: `P${i}`, weightKg: 50 + i * 9, age: 20 + i * 7 }),
      })
    }
    state = gameReducer(state, { type: 'START_RUN' })
    for (const total of [1, 999, 4321]) {
      const shares = mealShares(state.players, 'lunch', total)
      expect(shares.reduce((sum, s) => sum + s.kcal, 0), `total ${total}`).toBe(total)
      expect(shares).toHaveLength(6)
    }
  })

  it('reports each plate against that player’s own budget', () => {
    const state = unevenTable()
    for (const share of mealShares(state.players, 'dinner', 1200)) {
      expect(share.budget).toBe(playerMealBudget(share.player, 'dinner'))
    }
  })

  it('returns nothing for an empty table rather than dividing by zero', () => {
    expect(mealShares([], 'dinner', 500)).toEqual([])
  })

  it('sums the same budgets the pot is built from', () => {
    const state = unevenTable()
    const fromShares = mealShares(state.players, 'dinner', 0).reduce((s, x) => s + x.budget, 0)
    expect(fromShares).toBe(mealPot(state.players, 'dinner', 0))
  })
})

describe('everyone gets a fair share of the turns', () => {
  const MAX_PLAYERS = 6

  it('deals a round-robin evenly, earlier seats taking the remainder', () => {
    expect(turnsPerPlayer(12, 6)).toEqual([2, 2, 2, 2, 2, 2])
    expect(turnsPerPlayer(19, 6)).toEqual([4, 3, 3, 3, 3, 3])
    expect(turnsPerPlayer(5, 6)).toEqual([1, 1, 1, 1, 1, 0])
    expect(turnsPerPlayer(0, 3)).toEqual([0, 0, 0])
    expect(turnsPerPlayer(7, 0)).toEqual([])
  })

  it('never leaves one seat more than a single turn behind another', () => {
    for (let players = 2; players <= MAX_PLAYERS; players++) {
      for (let picks = 0; picks < 60; picks++) {
        const turns = turnsPerPlayer(picks, players)
        expect(Math.max(...turns) - Math.min(...turns), `${picks}/${players}`).toBeLessThanOrEqual(1)
        expect(turns.reduce((a, b) => a + b, 0), `${picks}/${players}`).toBe(picks)
      }
    }
  })

  /**
   * The requirement, stated over the real data rather than a chosen example.
   *
   * Six players cannot each get two turns inside a single meal — the largest
   * dish has eight ingredient slots and that needs twelve — so this is a
   * property of a whole run, and it only holds because the rotation carries
   * across meals rather than restarting at seat one.
   */
  it('gives every player at least two turns over any possible run', () => {
    const breakfast = dishesForMenu('breakfast')
    const rest = (['filipino', 'american', 'arabic', 'chinese'] as const).flatMap((m) =>
      dishesForMenu(m),
    )

    let worst = Infinity
    let worstCase = ''

    for (let players = 2; players <= MAX_PLAYERS; players++) {
      for (const b of breakfast) {
        for (const lunch of rest) {
          for (const dinner of rest) {
            const picks = b.slots.length + lunch.slots.length + dinner.slots.length
            const least = Math.min(...turnsPerPlayer(picks, players))
            if (least < worst) {
              worst = least
              worstCase = `${players} players · ${b.id} + ${lunch.id} + ${dinner.id} = ${picks} picks`
            }
          }
        }
      }
    }

    expect(worst, `worst case was ${worstCase}`).toBeGreaterThanOrEqual(2)
  })

  it('carries the rotation across meals instead of restarting at seat one', () => {
    let state = coopStart()
    state = gameReducer(state, { type: 'CHOOSE_DISH', dishId: 'tapsilog' })
    const dish = getDish('tapsilog')!
    state = shopCheaply(state)
    state = gameReducer(state, { type: 'CHECKOUT' })
    state = gameReducer(state, { type: 'NEXT_MEAL' })
    state = gameReducer(state, { type: 'CHOOSE_DISH', dishId: 'adobo' })

    // Two players and a six-slot breakfast: the next meal must resume where the
    // rotation left off, not hand seat one the first pick again.
    expect(picksBefore(state)).toBe(dish.slots.length)
    expect(pickerFor(state)?.id).toBe(state.players[dish.slots.length % 2]!.id)
  })

  it('shows the same picker when you go back to change an earlier ingredient', () => {
    let state = gameReducer(coopStart(), { type: 'CHOOSE_DISH', dishId: 'tapsilog' })
    state = gameReducer(state, { type: 'GOTO_INGREDIENT', index: 3 })
    const first = pickerFor(state)?.id
    state = gameReducer(state, { type: 'GOTO_INGREDIENT', index: 0 })
    state = gameReducer(state, { type: 'GOTO_INGREDIENT', index: 3 })
    expect(pickerFor(state)?.id).toBe(first)
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
