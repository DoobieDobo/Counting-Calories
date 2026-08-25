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
  /** Daily calorie delta applied to TDEE. */
  delta: number
}

/**
 * ±500 kcal/day is the conventional target for roughly half a kilo (one pound)
 * of change per week.
 */
export const GOALS: readonly GoalOption[] = [
  { id: 'lose', label: 'Lose weight', detail: 'About 0.5 kg (1 lb) a week', delta: -500 },
  { id: 'maintain', label: 'Maintain weight', detail: 'Stay where you are', delta: 0 },
  { id: 'gain', label: 'Gain weight', detail: 'About 0.5 kg (1 lb) a week', delta: +500 },
] as const

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

export function goalDelta(goal: Goal): number {
  const found = GOALS.find((g) => g.id === goal)
  return found ? found.delta : 0
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

export interface DailyTarget {
  bmr: number
  tdee: number
  /** The number the player actually plays against, rounded to a whole calorie. */
  target: number
  /** True when the safety floor raised the target above the goal arithmetic. */
  floored: boolean
  floor: number
}

/**
 * The daily calorie budget: TDEE nudged by the goal, then clamped so a weight-loss
 * goal can never push someone into an unsafe intake.
 */
export function dailyTarget(profile: Profile): DailyTarget {
  const base = bmr(profile)
  const total = base * activityMultiplier(profile.activity)
  const raw = total + goalDelta(profile.goal)
  const floor = CALORIE_FLOOR[profile.sex]
  const floored = raw < floor
  return {
    bmr: Math.round(base),
    tdee: Math.round(total),
    target: Math.round(floored ? floor : raw),
    floored,
    floor,
  }
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
