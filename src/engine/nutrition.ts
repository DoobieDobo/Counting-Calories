/**
 * The part that makes this a game rather than a calculator.
 *
 * 600 calories of soft drink and 600 calories of chicken and greens cost the
 * same at checkout, so the feedback after checkout is what has to tell them
 * apart. These helpers turn a finished cart into a macro breakdown, a grade,
 * and one plain-English line of coaching.
 */

import type { CartLine, CartTotals } from './cart'

export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const

export interface MacroSplit {
  /** Share of total calories, 0–1, from each macronutrient. */
  protein: number
  carbs: number
  fat: number
}

/**
 * Share of calories by macro. Computed from the macro grams rather than the
 * stated kcal, so the three slices always add to 1 and the bar never has a gap.
 */
export function macroSplit(totals: CartTotals): MacroSplit {
  const p = totals.protein * KCAL_PER_G.protein
  const c = totals.carbs * KCAL_PER_G.carbs
  const f = totals.fat * KCAL_PER_G.fat
  const sum = p + c + f
  if (sum <= 0) return { protein: 0, carbs: 0, fat: 0 }
  return { protein: p / sum, carbs: c / sum, fat: f / sum }
}

export type Grade = 'A' | 'B' | 'C' | 'D'

export interface MealVerdict {
  kcal: number
  budget: number
  /** Positive when under budget, negative when over. */
  remaining: number
  /** kcal ÷ budget. 1.0 is a perfect spend. */
  usage: number
  overBudget: boolean
  grade: Grade
  split: MacroSplit
  /** One or two sentences of coaching, most important first. */
  notes: string[]
}

/** How many of the cart's lines are fresh produce — the vegetable check. */
export function produceLines(lines: readonly CartLine[]): number {
  return lines.filter((l) => l.product.category === 'produce').length
}

/**
 * Grades a finished meal.
 *
 * Deliberately not calories-only: coming in far under budget is *not* an A,
 * because a game that rewards eating as little as possible would be teaching
 * the wrong thing entirely. Landing near the budget with decent protein and
 * something green on the plate is what scores well.
 */
export function gradeMeal(
  lines: readonly CartLine[],
  totals: CartTotals,
  budget: number,
): MealVerdict {
  const usage = budget > 0 ? totals.kcal / budget : 0
  const split = macroSplit(totals)
  const veg = produceLines(lines)
  const notes: string[] = []

  let score = 0

  // Spending close to the budget, from either side.
  if (usage > 1) score += 0
  else if (usage >= 0.85) score += 3
  else if (usage >= 0.7) score += 2
  else if (usage >= 0.5) score += 1

  // Protein keeps you full; too little is the most common failure here.
  if (split.protein >= 0.25) score += 2
  else if (split.protein >= 0.15) score += 1

  // Something fresh on the plate.
  if (veg >= 2) score += 2
  else if (veg >= 1) score += 1

  // Fat is not the enemy, but a meal that is mostly fat usually means fried.
  if (split.fat <= 0.35) score += 1
  else if (split.fat > 0.5) score -= 1

  const grade: Grade = totals.kcal > budget ? 'D' : score >= 7 ? 'A' : score >= 5 ? 'B' : score >= 3 ? 'C' : 'D'

  if (totals.kcal > budget) {
    notes.push(
      `That's ${totals.kcal - budget} calories over. Swap something out, or skip an extra.`,
    )
  } else if (usage < 0.5) {
    notes.push(
      `You only spent ${Math.round(usage * 100)}% of the budget. Calories are fuel, not a high score — an empty plate isn't a win.`,
    )
  } else if (usage >= 0.9) {
    notes.push(`Nicely judged — ${budget - totals.kcal} calories left over.`)
  }

  if (split.fat > 0.5) {
    notes.push(
      `${Math.round(split.fat * 100)}% of those calories came from fat. A leaner cut or a non-fried option buys you room for more food.`,
    )
  }

  if (split.protein < 0.15 && totals.kcal > 0) {
    notes.push(
      `Only ${Math.round(split.protein * 100)}% protein. Meals this light on protein tend not to keep you full for long.`,
    )
  } else if (split.protein >= 0.3) {
    notes.push(`Strong on protein at ${Math.round(split.protein * 100)}% — that's the filling kind of calorie.`)
  }

  if (veg === 0 && lines.length > 0) {
    notes.push('Nothing fresh in the cart. Vegetables are usually the cheapest calories on the shelf.')
  }

  return {
    kcal: totals.kcal,
    budget,
    remaining: budget - totals.kcal,
    usage,
    overBudget: totals.kcal > budget,
    grade,
    split,
    notes: notes.slice(0, 3),
  }
}

export interface DayVerdict {
  kcal: number
  target: number
  remaining: number
  grade: Grade
  split: MacroSplit
  note: string
}

/** Rolls the day's meals into one verdict against the daily target. */
export function gradeDay(
  meals: readonly { totals: CartTotals }[],
  target: number,
): DayVerdict {
  const kcal = meals.reduce((s, m) => s + m.totals.kcal, 0)
  const totals: CartTotals = meals.reduce<CartTotals>(
    (acc, m) => ({
      kcal: acc.kcal + m.totals.kcal,
      protein: acc.protein + m.totals.protein,
      carbs: acc.carbs + m.totals.carbs,
      fat: acc.fat + m.totals.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )

  const drift = target > 0 ? Math.abs(kcal - target) / target : 1
  const grade: Grade = drift <= 0.05 ? 'A' : drift <= 0.12 ? 'B' : drift <= 0.25 ? 'C' : 'D'

  const note =
    kcal > target
      ? `You finished ${kcal - target} calories over your daily target. One day over won't undo anything — it's the pattern that counts.`
      : target - kcal > target * 0.2
        ? `You came in ${target - kcal} calories under. That's a bigger gap than it looks: consistently under-eating is its own problem.`
        : `You landed within ${target - kcal} calories of your target. That's the whole game.`

  return { kcal, target, remaining: target - kcal, grade, split: macroSplit(totals), note }
}
