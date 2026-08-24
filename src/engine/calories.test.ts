import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_LEVELS,
  CALORIE_FLOOR,
  MEAL_ORDER,
  MEAL_SPLIT,
  bmr,
  convert,
  dailyTarget,
  mealBudget,
  mealBudgets,
  tdee,
  type Profile,
} from './calories'

const base: Profile = {
  name: 'Test',
  heightCm: 170,
  weightKg: 70,
  age: 30,
  sex: 'male',
  activity: 'moderate',
  goal: 'maintain',
}

describe('bmr', () => {
  it('matches a hand-computed Mifflin-St Jeor result for a male profile', () => {
    // 10(70) + 6.25(170) − 5(30) + 5 = 700 + 1062.5 − 150 + 5 = 1617.5
    expect(bmr(base)).toBeCloseTo(1617.5, 5)
  })

  it('matches a hand-computed result for a female profile', () => {
    // 10(60) + 6.25(160) − 5(25) − 161 = 600 + 1000 − 125 − 161 = 1314
    expect(bmr({ ...base, weightKg: 60, heightCm: 160, age: 25, sex: 'female' })).toBeCloseTo(1314, 5)
  })

  it('places the unspecified-sex estimate between the two sex-specific answers', () => {
    const male = bmr({ ...base, sex: 'male' })
    const female = bmr({ ...base, sex: 'female' })
    const unspecified = bmr({ ...base, sex: 'unspecified' })
    expect(unspecified).toBeGreaterThan(female)
    expect(unspecified).toBeLessThan(male)
    expect(unspecified).toBeCloseTo((male + female) / 2, 5)
  })
})

describe('tdee', () => {
  it('scales BMR by the activity multiplier', () => {
    expect(tdee({ ...base, activity: 'sedentary' })).toBeCloseTo(1617.5 * 1.2, 5)
    expect(tdee({ ...base, activity: 'athlete' })).toBeCloseTo(1617.5 * 1.9, 5)
  })

  it('has strictly increasing multipliers', () => {
    const multipliers = ACTIVITY_LEVELS.map((a) => a.multiplier)
    for (let i = 1; i < multipliers.length; i++) {
      expect(multipliers[i]!).toBeGreaterThan(multipliers[i - 1]!)
    }
  })
})

describe('dailyTarget', () => {
  it('subtracts 500 for a weight-loss goal', () => {
    const maintain = dailyTarget({ ...base, goal: 'maintain' })
    const lose = dailyTarget({ ...base, goal: 'lose' })
    expect(maintain.target - lose.target).toBe(500)
  })

  it('adds 500 for a weight-gain goal', () => {
    const maintain = dailyTarget({ ...base, goal: 'maintain' })
    const gain = dailyTarget({ ...base, goal: 'gain' })
    expect(gain.target - maintain.target).toBe(500)
  })

  it('never recommends below the safety floor, and says when it clamped', () => {
    // A very small, sedentary profile whose TDEE − 500 lands under 1200.
    const tiny: Profile = {
      ...base,
      heightCm: 150,
      weightKg: 42,
      age: 60,
      sex: 'female',
      activity: 'sedentary',
      goal: 'lose',
    }
    const result = dailyTarget(tiny)
    expect(result.target).toBe(CALORIE_FLOOR.female)
    expect(result.floored).toBe(true)
  })

  it('does not flag flooring for an ordinary profile', () => {
    const result = dailyTarget({ ...base, goal: 'lose' })
    expect(result.floored).toBe(false)
    expect(result.target).toBeGreaterThan(CALORIE_FLOOR.male)
  })
})

describe('mealBudgets', () => {
  it('splits the day into parts that sum back to the whole', () => {
    for (const daily of [1200, 1847, 2000, 2333, 3050]) {
      const budgets = mealBudgets(daily)
      const sum = MEAL_ORDER.reduce((s, slot) => s + budgets[slot], 0)
      expect(sum).toBe(daily)
    }
  })

  it('still sums to the whole when only some meals are played', () => {
    const slots = ['breakfast', 'lunch', 'dinner'] as const
    const budgets = mealBudgets(2137, slots)
    expect(slots.reduce((s, slot) => s + budgets[slot], 0)).toBe(2137)
  })

  it('gives lunch the largest share of a three-meal day', () => {
    const slots = ['breakfast', 'lunch', 'dinner'] as const
    const budgets = mealBudgets(2000, slots)
    expect(budgets.lunch).toBeGreaterThan(budgets.breakfast)
    expect(budgets.lunch).toBeGreaterThan(budgets.dinner)
  })

  it('has meal shares that add to 1', () => {
    const sum = MEAL_ORDER.reduce((s, slot) => s + MEAL_SPLIT[slot], 0)
    expect(sum).toBeCloseTo(1, 10)
  })

  it('exposes a single meal budget consistent with the full split', () => {
    const slots = ['breakfast', 'lunch', 'dinner'] as const
    expect(mealBudget(2000, 'lunch', slots)).toBe(mealBudgets(2000, slots).lunch)
  })
})

describe('convert', () => {
  it('round-trips height through feet and inches', () => {
    const cm = convert.feetInchesToCm(5, 9)
    expect(cm).toBeCloseTo(175.26, 2)
    expect(convert.cmToFeetInches(cm)).toEqual({ feet: 5, inches: 9 })
  })

  it('round-trips weight through pounds', () => {
    expect(convert.poundsToKg(154)).toBeCloseTo(69.85, 2)
    expect(convert.kgToPounds(convert.poundsToKg(154))).toBeCloseTo(154, 6)
  })
})
