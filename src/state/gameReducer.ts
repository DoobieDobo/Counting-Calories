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
}

export interface CompletedMeal {
  slot: MealSlot
  dishId: string
  dishName: string
  dishEmoji: string
  choices: Choices
  totals: CartTotals
  budget: number
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
  return state.players[state.current.slotIndex % state.players.length] ?? null
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

      const lines = buildCart(dish, state.current.choices, CATALOG)
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
