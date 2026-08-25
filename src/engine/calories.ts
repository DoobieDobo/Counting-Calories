/**
 * Turns body stats into the calorie budget the player spends at the grocery.
 *
 * Everything here is a pure function of its inputs so it can be unit-tested
 * without any React in the way.
 */

import type { ConcernId } from '../data/dietary'

export type Sex = 'male' | 'female' | 'unspecified'

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete'

export type Goal = 'lose' | 'maintain' | 'gain'

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface Profile {
  name: string
  /** Centimetres. Imperial input is converted at the form boundary. */
  heightCm: number
  /** Kilograms. */
  weightKg: number
  age: number
  sex: Sex
  activity: ActivityLevel
  goal: Goal
  /**
   * Dietary concerns to flag on the shelf — allergies, gout, halal and so on.
   * Optional because saves written before the feature existed have no such
   * field; every reader must treat that as an empty list.
   */
  avoid?: ConcernId[]
}

export interface ActivityOption {
  id: ActivityLevel
  label: string
  detail: string
  multiplier: number
}

/**
 * Standard Harris-Benedict style activity factors, the same set used by most
 * TDEE calculators.
 */
export const ACTIVITY_LEVELS: readonly ActivityOption[] = [
  {
    id: 'sedentary',
    label: 'Sedentary',
    detail: 'Desk job, little or no exercise',
    multiplier: 1.2,
  },
  {
    id: 'light',
    label: 'Lightly active',
    detail: 'Light exercise 1–3 days a week',
    multiplier: 1.375,
  },
  {
    id: 'moderate',
    label: 'Moderately active',
    detail: 'Moderate exercise 3–5 days a week',
    multiplier: 1.55,
  },
  {
    id: 'active',
    label: 'Very active',
    detail: 'Hard exercise 6–7 days a week',
    multiplier: 1.725,
  },
  {
    id: 'athlete',
    label: 'Extremely active',
    detail: 'Physical job, or training twice a day',
    multiplier: 1.9,
  },
] as const

export interface GoalOption {
  id: Goal
  label: string
  detail: string
  /** Which way the goal moves the target. The size of the move is per-person. */
  direction: -1 | 0 | 1
}

/**
 * "Up to", not "about" — the pace is capped at a share of the player's own
 * maintenance, so a smaller body gets a smaller move. See `paceDelta`.
 */
export const GOALS: readonly GoalOption[] = [
  { id: 'lose', label: 'Lose weight', detail: 'Up to about 0.5 kg (1 lb) a week', direction: -1 },
  { id: 'maintain', label: 'Maintain weight', detail: 'Stay where you are', direction: 0 },
  { id: 'gain', label: 'Gain weight', detail: 'Up to about 0.5 kg (1 lb) a week', direction: 1 },
] as const

/**
 * The fastest pace the game will set, and the largest share of maintenance it
 * will take to get there.
 *
 * A flat ±500 is the conventional figure, but it is a fixed subtraction applied
 * to wildly different maintenance levels: 19% of a 2,600-calorie day, 34% of a
 * 1,450-calorie one. That is why the old arithmetic pushed roughly half of all
 * sedentary players who wanted to lose weight below the safety floor — the
 * deficit was sized for someone else's body.
 */
export const MAX_PACE = 500
export const MAX_PACE_SHARE = 0.2

/**
 * How far short of `MAX_PACE` still counts as "the goal, as asked".
 *
 * Maintenance of 2,496 yields a 499-calorie deficit — eased by one calorie,
 * which is about nine grams a week. Telling someone their plan was adjusted
 * over that would be noise dressed up as candour.
 */
export const PACE_TOLERANCE = 10

/** Roughly the calories in a kilo of body tissue, for reporting a pace. */
const KCAL_PER_KG = 7700

/**
 * Lowest daily intake the game will ever recommend. Widely published clinical
 * floors for unsupervised dieting; the game refuses to coach anyone below these
 * even if the arithmetic says otherwise.
 */
export const CALORIE_FLOOR: Record<Sex, number> = {
  female: 1200,
  male: 1500,
  unspecified: 1200,
}

/** Share of the daily target allotted to each meal. Sums to 1. */
export const MEAL_SPLIT: Record<MealSlot, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
}

export const MEAL_ORDER: readonly MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'] as const

export const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

export function activityMultiplier(level: ActivityLevel): number {
  const found = ACTIVITY_LEVELS.find((a) => a.id === level)
  return found ? found.multiplier : 1.2
}

/**
 * How far the goal moves the target, sized to the player.
 *
 * Capped both absolutely and as a share of maintenance, so a 2,600-calorie day
 * still gets the conventional 500 while a 1,450-calorie one gets 290 — a
 * deficit that person can actually eat around.
 */
export function paceDelta(tdee: number, goal: Goal): number {
  const direction = GOALS.find((g) => g.id === goal)?.direction ?? 0
  if (direction === 0) return 0
  return direction * Math.min(MAX_PACE, MAX_PACE_SHARE * Math.max(0, tdee))
}

/** A daily calorie gap expressed as weight change per week. */
export function paceInKgPerWeek(dailyGap: number): number {
  return (Math.abs(dailyGap) * 7) / KCAL_PER_KG
}

/**
 * Mifflin-St Jeor basal metabolic rate — the modern default, more accurate than
 * Harris-Benedict for most people.
 *
 *   BMR = 10·kg + 6.25·cm − 5·age + s
 *   where s = +5 (male) or −161 (female)
 *
 * "Prefer not to say" takes the midpoint of the two constants (−78), which keeps
 * the estimate within about 80 kcal of either sex-specific answer.
 */
export function bmr(profile: Pick<Profile, 'heightCm' | 'weightKg' | 'age' | 'sex'>): number {
  const sexOffset = profile.sex === 'male' ? 5 : profile.sex === 'female' ? -161 : -78
  return 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + sexOffset
}

/** Total daily energy expenditure: BMR scaled by how much the player moves. */
export function tdee(profile: Pick<Profile, 'heightCm' | 'weightKg' | 'age' | 'sex' | 'activity'>): number {
  return bmr(profile) * activityMultiplier(profile.activity)
}

/**
 * Where a player sits against their own height, which is a different question
 * from whether the calorie arithmetic hit a floor.
 *
 * The two were conflated before, and the floor made a poor stand-in: 61% of
 * underweight players asking to lose weight clear it comfortably and used to be
 * handed a full deficit with nothing said. Height and weight answer this on
 * their own, so the check runs on every profile rather than only the clamped
 * ones.
 *
 * `low-healthy` exists so the advice is not naggy. 18.5–24.9 is a wide band;
 * someone at 24 losing a couple of kilos needs no warning, someone at 18.7 is a
 * step away from underweight.
 */
export type WeightBand = 'underweight' | 'low-healthy' | 'healthy' | 'above-healthy'

/** WHO cutoffs. Some populations use 23 rather than 25 for the upper bound. */
export const BMI_BANDS = { underweight: 18.5, lowHealthy: 20, healthy: 25 } as const

export function bmi(profile: Pick<Profile, 'heightCm' | 'weightKg'>): number {
  if (profile.heightCm <= 0) return 0
  const metres = profile.heightCm / 100
  return profile.weightKg / (metres * metres)
}

export function bandFor(value: number): WeightBand {
  if (value < BMI_BANDS.underweight) return 'underweight'
  if (value < BMI_BANDS.lowHealthy) return 'low-healthy'
  if (value < BMI_BANDS.healthy) return 'healthy'
  return 'above-healthy'
}

/**
 * Why the budget is not simply "maintenance, moved by the goal you picked".
 *
 * Kept as a value rather than as branching inside the screen: the decision is
 * the interesting part and belongs where it can be tested.
 */
export type BudgetAdvice =
  | 'none'
  /** Underweight and asked to lose. No deficit is set at all. */
  | 'underweight'
  /** Near the bottom of the healthy range. The deficit stands, gently noted. */
  | 'near-underweight'
  /** The pace was scaled or clamped, so it is slower than the goal implies. */
  | 'eased-pace'
  /** Maintenance is already at or below the lowest intake the game will set. */
  | 'at-maintenance'

export interface DailyTarget {
  bmr: number
  tdee: number
  /** The number the player actually plays against, rounded to a whole calorie. */
  target: number
  /** True when a floor moved the target away from the goal arithmetic. */
  floored: boolean
  floor: number
  bmi: number
  band: WeightBand
  /** Calories a day the goal actually moves the target, after every clamp. */
  pace: number
  advice: BudgetAdvice
}

/**
 * The daily calorie budget: maintenance, moved by a goal sized to this body,
 * then clamped so the move can never become an unsafe intake — or, just as
 * importantly, its own opposite.
 *
 * The old clamp was `max(raw, 1200)`, which ignored maintenance entirely. Anyone
 * burning under 1,200 who asked to *maintain* was handed 1,200: a surplus, from
 * the guard that exists to prevent bad advice. The floor now never rises above
 * maintenance for a lose-or-maintain goal, so the worst it can do is stop a
 * deficit, never invent a gain.
 */
export function dailyTarget(profile: Profile): DailyTarget {
  const base = bmr(profile)
  const total = base * activityMultiplier(profile.activity)
  const index = bmi(profile)
  const band = bandFor(index)

  const pace = paceDelta(total, profile.goal)
  const raw = total + pace

  const floor = CALORIE_FLOOR[profile.sex]
  const safeFloor =
    profile.goal === 'gain'
      ? floor // a surplus is the whole point; nothing to protect against
      : band === 'underweight'
        ? Math.max(floor, total) // never a deficit from an underweight start
        : Math.min(floor, total) // never a surplus from a deficit request

  const exact = Math.max(raw, safeFloor)
  const floored = exact > raw

  // Round first, then derive the pace from the rounded pair. Rounding the gap
  // separately can leave it a calorie off the two numbers on screen, and a
  // budget screen whose own arithmetic does not add up is not worth showing.
  const roundedTdee = Math.round(total)
  const target = Math.round(exact)

  return {
    bmr: Math.round(base),
    tdee: roundedTdee,
    target,
    floored,
    floor,
    bmi: index,
    band,
    pace: target - roundedTdee,
    // Judged on the rounded pair, not the exact one. Advice that disagreed with
    // the numbers printed beside it would read as a bug even when it wasn't.
    advice: adviceFor(profile.goal, band, roundedTdee, target, floor),
  }
}

function adviceFor(
  goal: Goal,
  band: WeightBand,
  tdeeValue: number,
  target: number,
  floor: number,
): BudgetAdvice {
  // Maintenance asks for no move, so the only thing that can surprise someone
  // is the floor raising them — which it only does from an underweight start.
  if (goal === 'maintain') {
    return band === 'underweight' && target > tdeeValue ? 'underweight' : 'none'
  }

  if (goal === 'lose') {
    if (band === 'underweight') return 'underweight'
    // Maintenance is already at the bottom of what the game will ever set, so
    // there is no deficit left to give — a fact about them, not about a pace.
    if (tdeeValue <= floor) return 'at-maintenance'
    if (band === 'low-healthy') return 'near-underweight'
  }

  // Either direction can be capped. The per-person share bites on a small body
  // wanting to lose and on a small body wanting to gain alike, and neither
  // should have their pace quietly changed on them.
  return MAX_PACE - Math.abs(target - tdeeValue) > PACE_TOLERANCE ? 'eased-pace' : 'none'
}

/**
 * Splits the daily target across meals.
 *
 * Rounding each share independently would drift by a few calories, so the last
 * meal in the list absorbs the remainder — the parts always sum back to the
 * whole, which matters because the day summary compares the two.
 */
export function mealBudgets(
  dailyCalories: number,
  slots: readonly MealSlot[] = MEAL_ORDER,
): Record<MealSlot, number> {
  const out = {} as Record<MealSlot, number>
  const totalShare = slots.reduce((sum, slot) => sum + MEAL_SPLIT[slot], 0)
  let assigned = 0

  slots.forEach((slot, i) => {
    if (i === slots.length - 1) {
      out[slot] = dailyCalories - assigned
    } else {
      const share = Math.round((dailyCalories * MEAL_SPLIT[slot]) / totalShare)
      out[slot] = share
      assigned += share
    }
  })

  return out
}

/** Budget for a single meal, used when a run only plays one slot at a time. */
export function mealBudget(
  dailyCalories: number,
  slot: MealSlot,
  slots: readonly MealSlot[] = MEAL_ORDER,
): number {
  const budgets = mealBudgets(dailyCalories, slots)
  return budgets[slot]
}

/** cm ⇄ ft/in and kg ⇄ lb, for the imperial toggle on the profile form. */
export const convert = {
  feetInchesToCm(feet: number, inches: number): number {
    return (feet * 12 + inches) * 2.54
  },
  cmToFeetInches(cm: number): { feet: number; inches: number } {
    const totalInches = Math.round(cm / 2.54)
    return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 }
  },
  poundsToKg(lb: number): number {
    return lb * 0.45359237
  },
  kgToPounds(kg: number): number {
    return kg / 0.45359237
  },
}
