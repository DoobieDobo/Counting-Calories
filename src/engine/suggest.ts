/**
 * Proposes the next three days from what actually went well.
 *
 * "What worked" is defined honestly: you chose it, you could afford it, and it
 * graded well. Anything you could not build at this table, or that a player's
 * dietary concerns rule out, is never proposed — suggesting food someone has
 * told us they cannot eat would be worse than suggesting nothing.
 *
 * Deterministic by design. The same block always produces the same plan, which
 * keeps it testable and stops the page reshuffling under the reader.
 */

import { dishesForMenu } from '../data/dishes'
import { MENUS_BY_MEAL } from '../data/menus'
import { CATALOG } from '../data/products'
import { flagsFor, type ConcernId } from '../data/dietary'
import type { Dish, MenuId, Slot } from '../data/types'
import { cheapestBuild, priciestBuild } from './cart'
import type { MealSlot } from './calories'
import {
  PLAN_DAYS,
  RUN_MEALS,
  mealPot,
  type CompletedDay,
  type Player,
} from '../state/gameReducer'

export interface Suggestion {
  slot: MealSlot
  dish: Dish
  /** Why this one, in a few words. */
  why: string
  /** Calorie range at this table: built as leanly as possible, up to freely. */
  low: number
  high: number
}

/** True when a required slot has no option this table can actually eat. */
function unbuildable(dish: Dish, concerns: readonly ConcernId[]): boolean {
  if (concerns.length === 0) return false
  return dish.slots.some(
    (slot) =>
      !slot.optional &&
      slot.options.every((o) => flagsFor(o.productId, concerns).some((f) => f.level === 'avoid')),
  )
}

/** How many optional slots are compromised — a soft penalty, not a veto. */
function flaggedSlots(dish: Dish, concerns: readonly ConcernId[]): number {
  if (concerns.length === 0) return 0
  return dish.slots.filter((slot: Slot) =>
    slot.options.every((o) => flagsFor(o.productId, concerns).some((f) => f.level === 'avoid')),
  ).length
}

const GRADE_SCORE: Record<string, number> = { A: 60, B: 45, C: 20, D: -30 }

const ALL_MENUS = ['breakfast', 'filipino', 'american', 'arabic', 'chinese'] as const

/** Which menu a dish belongs to. */
function menuOf(dishId: string): MenuId | undefined {
  return ALL_MENUS.find((m) => dishesForMenu(m).some((d) => d.id === dishId))
}

/**
 * Builds one plan of PLAN_DAYS × RUN_MEALS suggestions.
 *
 * Returns fewer suggestions for a slot only when nothing is affordable or
 * edible, which the caller should render as an honest gap rather than filler.
 */
export function suggestPlan(
  days: readonly CompletedDay[],
  players: readonly Player[],
  concerns: readonly ConcernId[],
): Suggestion[][] {
  const servings = Math.max(1, players.length)

  // What happened last block, in one pass: per dish, the best grade it earned
  // and whether it ever came in on budget; and how often each menu was chosen.
  const seen = new Map<string, { score: number; onBudget: boolean }>()
  const menuUse = new Map<MenuId, number>()

  for (const day of days) {
    for (const meal of day.meals) {
      const score = GRADE_SCORE[meal.verdict.grade] ?? 0
      const previous = seen.get(meal.dishId)
      if (!previous || score > previous.score) {
        seen.set(meal.dishId, { score, onBudget: !meal.verdict.overBudget })
      }

      const menu = menuOf(meal.dishId)
      if (menu) menuUse.set(menu, (menuUse.get(menu) ?? 0) + 1)
    }
  }

  const used = new Set<string>()
  const plan: Suggestion[][] = []

  for (let dayIndex = 0; dayIndex < PLAN_DAYS; dayIndex++) {
    const dayPlan: Suggestion[] = []

    for (const slot of RUN_MEALS) {
      const budget = mealPot(players, slot, 0)
      const candidates = MENUS_BY_MEAL[slot].flatMap((menu) => dishesForMenu(menu))

      let best: { dish: Dish; score: number; why: string } | null = null

      for (const dish of candidates) {
        if (used.has(dish.id)) continue
        if (unbuildable(dish, concerns)) continue

        const low = cheapestBuild(dish, CATALOG, servings)
        if (low > budget) continue // cannot be built here at all

        const past = seen.get(dish.id)
        const menu = menuOf(dish.id)

        let score = 0
        let why: string

        if (past) {
          score += past.score + (past.onBudget ? 25 : 0)
          // Staying inside the budget is not the same as eating well — a meal
          // can come in half-spent and still grade badly. Saying "it graded
          // well" about a D would make the whole section untrustworthy.
          if (past.score >= GRADE_SCORE.B!) {
            why = past.onBudget
              ? 'you cooked this on budget and it graded well'
              : 'you cooked this well before — worth another go, leaner'
          } else if (past.onBudget) {
            why = 'you could afford this last time — worth building out further'
          } else {
            why = 'you cooked this before, but it went over — worth another go, leaner'
          }
        } else {
          score += 30 + (menu ? (menuUse.get(menu) ?? 0) * 6 : 0)
          why = menu
            ? `new, from the ${menu} menu you kept coming back to`
            : 'something new to try'
        }

        // Room to build it comfortably, not just barely.
        const headroom = Math.min(20, Math.round(((budget - low) / Math.max(1, budget)) * 30))
        score += headroom
        score -= flaggedSlots(dish, concerns) * 15

        // Stable tiebreak so the same block always yields the same plan.
        if (!best || score > best.score || (score === best.score && dish.id < best.dish.id)) {
          best = { dish, score, why }
        }
      }

      if (best) {
        used.add(best.dish.id)
        dayPlan.push({
          slot,
          dish: best.dish,
          why: best.why,
          low: cheapestBuild(best.dish, CATALOG, servings),
          high: priciestBuild(best.dish, CATALOG, servings),
        })
      }
    }

    plan.push(dayPlan)
  }

  return plan
}
