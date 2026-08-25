import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_LEVELS,
  BMI_BANDS,
  CALORIE_FLOOR,
  MEAL_ORDER,
  MEAL_SPLIT,
  PACE_TOLERANCE,
  bandFor,
  bmi,
  bmr,
  convert,
  dailyTarget,
  mealBudget,
  mealBudgets,
  paceDelta,
  paceInKgPerWeek,
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
    // Small and sedentary: the goal arithmetic lands well under 1,200.
    const small: Profile = {
      ...base,
      heightCm: 160,
      weightKg: 55,
      age: 35,
      sex: 'female',
      activity: 'sedentary',
      goal: 'lose',
    }
    const result = dailyTarget(small)
    expect(result.target).toBe(CALORIE_FLOOR.female)
    expect(result.floored).toBe(true)
  })

  it('does not flag flooring for an ordinary profile', () => {
    const result = dailyTarget({ ...base, goal: 'lose' })
    expect(result.floored).toBe(false)
    expect(result.target).toBeGreaterThan(CALORIE_FLOOR.male)
  })
})

describe('the pace is sized to the body', () => {
  it('gives the conventional 500 to anyone with room for it', () => {
    // Maintenance of 2,507: 20% is 501, so the cap does not bite.
    expect(paceDelta(tdee(base), 'lose')).toBe(-500)
    expect(paceDelta(tdee(base), 'gain')).toBe(500)
    expect(paceDelta(tdee(base), 'maintain')).toBe(0)
  })

  it('takes a share of maintenance when 500 would be too much of it', () => {
    expect(paceDelta(1450, 'lose')).toBeCloseTo(-290, 5)
    expect(paceDelta(2500, 'lose')).toBeCloseTo(-500, 5)
  })

  it('reports the pace it actually applied, not the one asked for', () => {
    const small = dailyTarget({
      ...base,
      heightCm: 158,
      weightKg: 54,
      age: 45,
      sex: 'female',
      activity: 'sedentary',
      goal: 'lose',
    })
    expect(small.pace).toBe(small.target - small.tdee)
    expect(Math.abs(small.pace)).toBeLessThan(500)
    expect(paceInKgPerWeek(small.pace)).toBeLessThan(0.5)
  })
})

describe('weight bands', () => {
  it('reads BMI off height and weight', () => {
    expect(bmi({ heightCm: 170, weightKg: 70 })).toBeCloseTo(24.22, 2)
    expect(bmi({ heightCm: 0, weightKg: 70 })).toBe(0)
  })

  it('puts each boundary on the upper band', () => {
    expect(bandFor(18.49)).toBe('underweight')
    expect(bandFor(BMI_BANDS.underweight)).toBe('low-healthy')
    expect(bandFor(19.9)).toBe('low-healthy')
    expect(bandFor(BMI_BANDS.lowHealthy)).toBe('healthy')
    expect(bandFor(24.9)).toBe('healthy')
    expect(bandFor(BMI_BANDS.healthy)).toBe('above-healthy')
  })
})

describe('the budget never argues with the body', () => {
  /**
   * The three defects this replaced, each as its own case. All were reachable
   * by ordinary people entering ordinary numbers.
   */

  it('does not turn a maintain goal into a surplus', () => {
    // Maintenance of ~1,082 — under the 1,200 floor. The old clamp handed her
    // 1,200 and called it maintaining.
    const her: Profile = {
      ...base,
      heightCm: 150,
      weightKg: 45,
      age: 65,
      sex: 'female',
      activity: 'sedentary',
      goal: 'maintain',
    }
    const result = dailyTarget(her)
    expect(result.tdee).toBeLessThan(CALORIE_FLOOR.female)
    expect(result.target).toBe(result.tdee)
  })

  it('sets no deficit at all from an underweight start', () => {
    // BMI 18.3, maintenance 2,162 — clears the floor easily, so the old code
    // handed him a full 500-calorie deficit and said nothing.
    const him: Profile = {
      ...base,
      heightCm: 178,
      weightKg: 58,
      age: 25,
      sex: 'male',
      activity: 'light',
      goal: 'lose',
    }
    const result = dailyTarget(him)
    expect(result.band).toBe('underweight')
    expect(result.advice).toBe('underweight')
    expect(result.target).toBeGreaterThanOrEqual(result.tdee)
  })

  it('eases the pace rather than refusing a small sedentary body', () => {
    const her = dailyTarget({
      ...base,
      heightCm: 162,
      weightKg: 72,
      age: 40,
      sex: 'female',
      activity: 'sedentary',
      goal: 'lose',
    })
    expect(her.band).toBe('above-healthy')
    expect(her.advice).toBe('eased-pace')
    expect(her.target).toBeLessThan(her.tdee)
  })

  it('says nothing when the goal was delivered as asked', () => {
    expect(dailyTarget({ ...base, goal: 'lose' }).advice).toBe('none')
    expect(dailyTarget({ ...base, goal: 'maintain' }).advice).toBe('none')
    expect(dailyTarget({ ...base, goal: 'gain' }).advice).toBe('none')
  })

  it('keeps the underweight warning to the goal it applies to', () => {
    // Being underweight is a reason not to lose. It is not a reason to say
    // anything to someone who asked to gain, or to hold their maintenance.
    const underweight = { ...base, heightCm: 178, weightKg: 58, age: 25, activity: 'light' as const }
    expect(dailyTarget({ ...underweight, goal: 'lose' }).advice).toBe('underweight')
    expect(dailyTarget({ ...underweight, goal: 'maintain' }).advice).toBe('none')
    expect(dailyTarget({ ...underweight, goal: 'gain' }).advice).not.toBe('underweight')
  })

  it('says so when a gain was capped too, not only a loss', () => {
    // The per-person cap is symmetric, so the surplus can shrink the same way
    // a deficit does. Changing it silently would be the same defect mirrored.
    const small = dailyTarget({
      ...base,
      heightCm: 155,
      weightKg: 48,
      age: 55,
      sex: 'female',
      activity: 'sedentary',
      goal: 'gain',
    })
    expect(small.pace).toBeGreaterThan(0)
    expect(small.pace).toBeLessThan(500)
    expect(small.advice).toBe('eased-pace')
  })
})

describe('across every body someone might enter', () => {
  /**
   * The sweep that would have caught all three defects. Invariants over the
   * plausible input space beat any number of hand-picked examples — the old
   * arithmetic passed every example test it had.
   */
  const profiles: Profile[] = []
  for (const sex of ['female', 'male', 'unspecified'] as const)
    for (const activity of ACTIVITY_LEVELS.map((a) => a.id))
      for (let weightKg = 40; weightKg <= 120; weightKg += 10)
        for (let heightCm = 145; heightCm <= 195; heightCm += 10)
          for (let age = 18; age <= 80; age += 8)
            profiles.push({ ...base, sex, activity, weightKg, heightCm, age })

  it('covers a wide spread of bodies', () => {
    expect(profiles.length).toBeGreaterThan(1000)
  })

  it('never sets a lose or maintain target above maintenance', () => {
    // Underweight is the deliberate exception: there the floor is allowed to
    // raise the target, because holding someone underweight at a low intake is
    // the harm the floor exists to prevent.
    for (const goal of ['lose', 'maintain'] as const) {
      for (const profile of profiles) {
        const r = dailyTarget({ ...profile, goal })
        if (r.band === 'underweight') continue
        expect(r.target, `${goal} ${profile.sex} ${profile.weightKg}kg ${profile.heightCm}cm`).
          toBeLessThanOrEqual(r.tdee)
      }
    }
  })

  it('never sets a target below what is safe for that body', () => {
    for (const profile of profiles) {
      const r = dailyTarget({ ...profile, goal: 'lose' })
      const safe = Math.min(CALORIE_FLOOR[profile.sex], r.tdee)
      expect(r.target, `${profile.sex} ${profile.weightKg}kg ${profile.heightCm}cm`).
        toBeGreaterThanOrEqual(safe - 1)
    }
  })

  it('never sets a deficit for an underweight body, whatever the arithmetic says', () => {
    for (const profile of profiles) {
      const r = dailyTarget({ ...profile, goal: 'lose' })
      if (r.band !== 'underweight') continue
      expect(r.target, `${profile.weightKg}kg ${profile.heightCm}cm`).toBeGreaterThanOrEqual(r.tdee)
      expect(r.advice).toBe('underweight')
    }
  })

  it('stays quiet exactly when there is nothing to say', () => {
    // Two implications, not one. Silence must mean the goal was delivered; and
    // a delivered goal to a body with room to lose must be silent. A body near
    // the bottom of the healthy range is told either way — that note is about
    // them, not about the pace.
    for (const goal of ['lose', 'maintain', 'gain'] as const) {
      for (const profile of profiles) {
        const r = dailyTarget({ ...profile, goal })
        const asked = Math.round(r.tdee + (goal === 'maintain' ? 0 : goal === 'lose' ? -500 : 500))
        const delivered = Math.abs(r.target - asked) <= PACE_TOLERANCE
        const where = `${goal} ${profile.sex} ${profile.weightKg}kg ${profile.heightCm}cm`

        if (r.advice === 'none') expect(delivered, `silent but not delivered: ${where}`).toBe(true)
        if (delivered && (r.band === 'healthy' || r.band === 'above-healthy')) {
          expect(r.advice, `delivered but still advising: ${where}`).toBe('none')
        }
      }
    }
  })

  it('reports a pace that matches the target it set', () => {
    for (const goal of ['lose', 'maintain', 'gain'] as const) {
      for (const profile of profiles) {
        const r = dailyTarget({ ...profile, goal })
        expect(r.pace).toBe(r.target - r.tdee)
      }
    }
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
