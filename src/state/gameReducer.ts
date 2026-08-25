/**
 * The whole game as one reducer.
 *
 * Solo and co-op are the same machine: solo is just the one-player case. That
 * keeps the shopping loop — which is the entire game — from forking into two
 * code paths that drift apart.
 */

import { CATALOG } from '../data/products'
import { getDish } from '../data/dishes'
import { MENUS_BY_MEAL } from '../data/menus'
import type { ConcernId } from '../data/dietary'
import type { MenuId } from '../data/types'
import {
  MEAL_LABELS,
  dailyTarget,
  mealBudgets,
  type DailyTarget,
  type MealSlot,
  type Profile,
} from '../engine/calories'
import { buildCart, cartTotals, type Choices, type CartTotals } from '../engine/cart'
import { gradeMeal, type MealVerdict } from '../engine/nutrition'

export type Mode = 'solo' | 'coop'

export type Phase =
  | 'welcome'
  | 'mode'
  | 'profile'
  | 'roster'
  | 'budget'
  | 'menu'
  | 'dish'
  | 'store'
  | 'cart'
  | 'meal-result'
  | 'day-result'

export interface Player {
  id: string
  profile: Profile
  target: DailyTarget
}

/** The meal slots a run plays through, in order. */
export const RUN_MEALS: readonly MealSlot[] = ['breakfast', 'lunch', 'dinner'] as const

export interface CurrentMeal {
  slot: MealSlot
  menuId: MenuId | null
  dishId: string | null
  /** Which ingredient slot the store is showing. */
  slotIndex: number
  choices: Choices
  /** Calories available for this meal: the players' share plus anything banked. */
  budget: number
  /**
   * How many portions are being cooked — one per player. Recipes are authored
   * for a single serving, so this has to scale with the pooled budget or a
   * co-op meal is priced for one person out of a pot meant for the whole table.
   */
  servings: number
}

export interface CompletedMeal {
  slot: MealSlot
  dishId: string
  dishName: string
  dishEmoji: string
  choices: Choices
  totals: CartTotals
  budget: number
  servings: number
  verdict: MealVerdict
}

export interface GameState {
  phase: Phase
  mode: Mode
  players: Player[]
  mealIndex: number
  current: CurrentMeal | null
  history: CompletedMeal[]
  /** Unspent calories carried forward from earlier meals in this run. */
  banked: number
}

export type Action =
  | { type: 'SET_MODE'; mode: Mode }
  | { type: 'ADD_PLAYER'; profile: Profile }
  | { type: 'REMOVE_PLAYER'; id: string }
  | { type: 'GOTO'; phase: Phase }
  | { type: 'START_RUN' }
  | { type: 'CHOOSE_MENU'; menuId: MenuId }
  | { type: 'CHOOSE_DISH'; dishId: string }
  | { type: 'CHOOSE_OPTION'; slotId: string; optionId: string | null }
  | { type: 'GOTO_INGREDIENT'; index: number }
  | { type: 'REVIEW_CART' }
  | { type: 'CHECKOUT' }
  | { type: 'NEXT_MEAL' }
  | { type: 'RESTART' }
  | { type: 'HYDRATE'; state: GameState }

export const initialState: GameState = {
  phase: 'welcome',
  mode: 'solo',
  players: [],
  mealIndex: 0,
  current: null,
  history: [],
  banked: 0,
}

let playerCounter = 0

function makePlayerId(): string {
  playerCounter += 1
  return `player-${playerCounter}`
}

/**
 * The pot for one meal: every player's share of that meal, plus whatever went
 * unspent earlier in the day. Pooling is the point of co-op — one budget the
 * table has to agree on how to spend.
 */
export function mealPot(players: readonly Player[], slot: MealSlot, banked: number): number {
  const share = players.reduce(
    (sum, p) => sum + mealBudgets(p.target.target, RUN_MEALS)[slot],
    0,
  )
  return share + banked
}

/** Combined daily target across the table. */
export function dayTarget(players: readonly Player[]): number {
  return players.reduce((sum, p) => sum + p.target.target, 0)
}

/** What one player's own share of a meal's budget is, before any rollover. */
export function playerMealBudget(player: Player, slot: MealSlot): number {
  return mealBudgets(player.target.target, RUN_MEALS)[slot]
}

export interface MealShare {
  player: Player
  /** Calories from this meal that end up on their plate. */
  kcal: number
  /** Their own budget for this meal, so the share means something on its own. */
  budget: number
}

/**
 * Splits a cooked meal across the table in proportion to each player's own
 * calorie target.
 *
 * Everyone puts a different amount into the pot — the budget has always been
 * the sum of each player's share — so dividing the food equally afterwards
 * contradicted that. Someone on 2,600 a day eats more of the pot than someone
 * on 1,300, and their plate is judged against their own budget rather than an
 * average nobody is on.
 *
 * Uses largest-remainder rounding so the plates add back up to exactly what was
 * cooked; naive rounding loses or invents a calorie or two, which looks like a
 * bug on a receipt.
 */
export function mealShares(
  players: readonly Player[],
  slot: MealSlot,
  totalKcal: number,
): MealShare[] {
  if (players.length === 0) return []

  const budgets = players.map((p) => playerMealBudget(p, slot))
  const pot = budgets.reduce((a, b) => a + b, 0)

  // Degenerate case: no appetite at all. Split evenly rather than divide by zero.
  if (pot <= 0) {
    const even = Math.round(totalKcal / players.length)
    return players.map((player, i) => ({ player, kcal: even, budget: budgets[i]! }))
  }

  const exact = budgets.map((b) => (totalKcal * b) / pot)
  const floors = exact.map((n) => Math.floor(n))
  let leftover = totalKcal - floors.reduce((a, b) => a + b, 0)

  // Hand the remaining whole calories to whoever was rounded down hardest.
  const order = exact
    .map((n, i) => ({ i, fraction: n - Math.floor(n) }))
    .sort((a, b) => b.fraction - a.fraction)

  const kcal = [...floors]
  for (const { i } of order) {
    if (leftover <= 0) break
    kcal[i]! += 1
    leftover -= 1
  }

  return players.map((player, i) => ({ player, kcal: kcal[i]!, budget: budgets[i]! }))
}

/**
 * Every dietary concern anyone at the table has switched on.
 *
 * The union, not the intersection: the shelf is shared, so one person's allergy
 * is the whole table's constraint.
 */
export function tableConcerns(players: readonly Player[]): ConcernId[] {
  const all = new Set<ConcernId>()
  for (const player of players) {
    for (const concern of player.profile.avoid ?? []) all.add(concern)
  }
  return [...all]
}

/**
 * Breakfast draws from a single menu, so asking the player to pick it from a
 * list of one is pure friction. When a meal slot offers exactly one menu it is
 * chosen for them and the run opens straight onto the dishes.
 */
export function soleMenuFor(slot: MealSlot): MenuId | null {
  const menus = MENUS_BY_MEAL[slot]
  return menus.length === 1 ? (menus[0] ?? null) : null
}

function startMeal(state: GameState, mealIndex: number): CurrentMeal {
  const slot = RUN_MEALS[mealIndex] ?? 'dinner'
  return {
    slot,
    menuId: soleMenuFor(slot),
    dishId: null,
    slotIndex: 0,
    choices: {},
    budget: mealPot(state.players, slot, state.banked),
    servings: Math.max(1, state.players.length),
  }
}

function phaseForMeal(meal: CurrentMeal): Phase {
  return meal.menuId ? 'dish' : 'menu'
}

/**
 * Whose turn it is to tap. Everyone talks about every ingredient, but only one
 * person commits it, and that rotates — otherwise the loudest player quietly
 * ends up choosing the whole cart.
 */
export function pickerFor(state: GameState): Player | null {
  if (state.mode !== 'coop' || state.players.length === 0 || !state.current) return null
  const turn = picksBefore(state) + state.current.slotIndex
  return state.players[turn % state.players.length] ?? null
}

/**
 * Ingredient decisions made in meals already finished this run.
 *
 * Derived from history rather than counted into state, so there is nothing to
 * migrate, nothing to fall out of sync, and revisiting an earlier ingredient
 * shows the same picker it showed the first time.
 */
export function picksBefore(state: GameState): number {
  return state.history.reduce((sum, meal) => sum + (getDish(meal.dishId)?.slots.length ?? 0), 0)
}

/**
 * How many turns each seat gets when `totalPicks` decisions are dealt
 * round-robin, seat 0 first.
 *
 * Exists so the fairness guarantee can be tested directly. Six players cannot
 * each get two turns inside one meal — the largest dish has eight ingredient
 * slots and that would need twelve — so the guarantee is a property of a whole
 * three-meal run, which is only true because the rotation carries across meals.
 */
export function turnsPerPlayer(totalPicks: number, playerCount: number): number[] {
  if (playerCount <= 0) return []
  const base = Math.floor(totalPicks / playerCount)
  const remainder = totalPicks % playerCount
  return Array.from({ length: playerCount }, (_, seat) => base + (seat < remainder ? 1 : 0))
}

/** Turns taken so far this run, per seat — shown on the chips in the store. */
export function turnsSoFar(state: GameState): number[] {
  const done = picksBefore(state) + (state.current?.slotIndex ?? 0)
  return turnsPerPlayer(done, state.players.length)
}

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state

    case 'SET_MODE':
      return { ...state, mode: action.mode, players: [], phase: 'profile' }

    case 'ADD_PLAYER': {
      const player: Player = {
        id: makePlayerId(),
        profile: action.profile,
        target: dailyTarget(action.profile),
      }
      // Solo has exactly one player, so re-submitting the form replaces them
      // rather than seating a second person at the table.
      const players = state.mode === 'solo' ? [player] : [...state.players, player]
      return { ...state, players, phase: state.mode === 'solo' ? 'budget' : 'roster' }
    }

    case 'REMOVE_PLAYER':
      return { ...state, players: state.players.filter((p) => p.id !== action.id) }

    case 'GOTO':
      return { ...state, phase: action.phase }

    case 'START_RUN': {
      if (state.players.length === 0) return state
      const fresh: GameState = {
        ...state,
        mealIndex: 0,
        history: [],
        banked: 0,
        current: null,
        phase: 'menu',
      }
      const meal = startMeal(fresh, 0)
      return { ...fresh, current: meal, phase: phaseForMeal(meal) }
    }

    case 'CHOOSE_MENU':
      if (!state.current) return state
      return {
        ...state,
        phase: 'dish',
        current: { ...state.current, menuId: action.menuId, dishId: null },
      }

    case 'CHOOSE_DISH':
      if (!state.current) return state
      return {
        ...state,
        phase: 'store',
        current: { ...state.current, dishId: action.dishId, slotIndex: 0, choices: {} },
      }

    case 'CHOOSE_OPTION': {
      if (!state.current || !state.current.dishId) return state
      const dish = getDish(state.current.dishId)
      if (!dish) return state

      const choices = { ...state.current.choices, [action.slotId]: action.optionId }
      const nextIndex = state.current.slotIndex + 1
      const done = nextIndex >= dish.slots.length

      return {
        ...state,
        phase: done ? 'cart' : 'store',
        current: {
          ...state.current,
          choices,
          slotIndex: done ? state.current.slotIndex : nextIndex,
        },
      }
    }

    case 'GOTO_INGREDIENT': {
      if (!state.current || !state.current.dishId) return state
      const dish = getDish(state.current.dishId)
      if (!dish) return state
      const index = Math.max(0, Math.min(action.index, dish.slots.length - 1))
      return { ...state, phase: 'store', current: { ...state.current, slotIndex: index } }
    }

    case 'REVIEW_CART':
      if (!state.current) return state
      return { ...state, phase: 'cart' }

    case 'CHECKOUT': {
      if (!state.current || !state.current.dishId) return state
      const dish = getDish(state.current.dishId)
      if (!dish) return state

      const lines = buildCart(dish, state.current.choices, CATALOG, state.current.servings)
      const totals = cartTotals(lines)
      // The cart screen gates this, but the reducer refuses too — an over-budget
      // checkout must never be reachable by any route.
      if (totals.kcal > state.current.budget) return state

      const completed: CompletedMeal = {
        slot: state.current.slot,
        dishId: dish.id,
        dishName: dish.name,
        dishEmoji: dish.emoji,
        choices: state.current.choices,
        totals,
        budget: state.current.budget,
        servings: state.current.servings,
        verdict: gradeMeal(lines, totals, state.current.budget),
      }

      return {
        ...state,
        phase: 'meal-result',
        history: [...state.history, completed],
        banked: state.current.budget - totals.kcal,
      }
    }

    case 'NEXT_MEAL': {
      const nextIndex = state.mealIndex + 1
      if (nextIndex >= RUN_MEALS.length) {
        return { ...state, phase: 'day-result', current: null }
      }
      const advanced = { ...state, mealIndex: nextIndex }
      const meal = startMeal(advanced, nextIndex)
      return { ...advanced, phase: phaseForMeal(meal), current: meal }
    }

    case 'RESTART':
      return { ...initialState, players: state.players, mode: state.mode, phase: 'budget' }

    default:
      return state
  }
}

/** Human-readable name for the meal in progress, for headers. */
export function currentMealLabel(state: GameState): string {
  return state.current ? MEAL_LABELS[state.current.slot] : ''
}
