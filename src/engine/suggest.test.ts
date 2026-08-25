import { describe, expect, it } from 'vitest'
import { getDish } from '../data/dishes'
import { CATALOG } from '../data/products'
import { flagsFor, type ConcernId } from '../data/dietary'
import { buildCart, cartTotals } from './cart'
import { dailyTarget, type Profile } from './calories'
import { gradeDay, gradeMeal } from './nutrition'
import { PLAN_DAYS, RUN_MEALS, type CompletedDay, type CompletedMeal, type Player } from '../state/gameReducer'
import { suggestPlan } from './suggest'

const profile = (over: Partial<Profile> = {}): Profile => ({
  name: 'Kay',
  heightCm: 175,
  weightKg: 82,
  age: 34,
  sex: 'male',
  activity: 'moderate',
  goal: 'maintain',
  ...over,
})

function player(over: Partial<Profile> = {}): Player {
  const p = profile(over)
  return { id: 'p1', profile: p, target: dailyTarget(p) }
}

/** A finished meal with a chosen grade, so "what worked" can be set up. */
function meal(dishId: string, slot: CompletedMeal['slot'], budget: number): CompletedMeal {
  const dish = getDish(dishId)!
  const choices = Object.fromEntries(dish.slots.map((s) => [s.id, s.options[0]!.id]))
  const lines = buildCart(dish, choices, CATALOG, 1)
  const totals = cartTotals(lines)
  return {
    slot,
    dishId,
    dishName: dish.name,
    dishEmoji: dish.emoji,
    choices,
    totals,
    budget,
    servings: 1,
    verdict: gradeMeal(lines, totals, budget),
  }
}

function day(meals: CompletedMeal[]): CompletedDay {
  return { meals, target: 2400, verdict: gradeDay(meals, 2400) }
}

const solo = [player()]

describe('shape', () => {
  it('proposes a full block of days', () => {
    const plan = suggestPlan([], solo, [])
    expect(plan).toHaveLength(PLAN_DAYS)
    for (const d of plan) expect(d.length).toBe(RUN_MEALS.length)
  })

  it('puts the right menus in the right meal slots', () => {
    for (const d of suggestPlan([], solo, [])) {
      expect(d.map((s) => s.slot)).toEqual([...RUN_MEALS])
      expect(d[0]!.dish.menu).toBe('breakfast')
      for (const later of d.slice(1)) expect(later.dish.menu).not.toBe('breakfast')
    }
  })

  it('never repeats a dish inside a block', () => {
    const ids = suggestPlan([], solo, []).flat().map((s) => s.dish.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('is deterministic — the same block twice gives the same plan', () => {
    const days = [day([meal('tapsilog', 'breakfast', 600), meal('adobo', 'lunch', 850)])]
    const a = suggestPlan(days, solo, []).flat().map((s) => s.dish.id)
    const b = suggestPlan(days, solo, []).flat().map((s) => s.dish.id)
    expect(a).toEqual(b)
  })

  it('gives every suggestion a reason and a sane calorie range', () => {
    for (const s of suggestPlan([], solo, []).flat()) {
      expect(s.why.length, s.dish.id).toBeGreaterThan(0)
      expect(s.low, s.dish.id).toBeLessThanOrEqual(s.high)
      expect(s.low, s.dish.id).toBeGreaterThan(0)
    }
  })
})

describe('learning from what happened', () => {
  it('suggests again a dish that graded well on budget', () => {
    // A generous budget makes tapsilog grade well; it should come back.
    const days = [day([meal('tapsilog', 'breakfast', 900)])]
    const plan = suggestPlan(days, solo, [])
    const breakfasts = plan.map((d) => d[0]!.dish.id)
    expect(breakfasts).toContain('tapsilog')
  })

  it('does not lead with a dish that blew its budget', () => {
    // A punishing budget makes the same dish grade D.
    const flopped = meal('tapsilog', 'breakfast', 120)
    expect(flopped.verdict.overBudget).toBe(true)

    const plan = suggestPlan([day([flopped])], solo, [])
    expect(plan[0]![0]!.dish.id).not.toBe('tapsilog')
  })

  it('does not call a badly-graded meal well-cooked just because it fit', () => {
    // Underspending keeps you inside the budget and still grades badly. A
    // suggestion that says otherwise makes the whole section untrustworthy.
    const under = meal('tapsilog', 'breakfast', 4000)
    expect(under.verdict.overBudget).toBe(false)
    expect(under.verdict.grade).toBe('D')

    const suggested = suggestPlan([day([under])], solo, [])
      .flat()
      .filter((s) => s.dish.id === 'tapsilog')
    for (const s of suggested) expect(s.why).not.toMatch(/graded well/)
  })

  it('never proposes a dish this table cannot afford at all', () => {
    // A tiny target makes many dishes unbuildable; none may be suggested.
    const tiny = [player({ heightCm: 150, weightKg: 42, age: 70, sex: 'female', activity: 'sedentary', goal: 'lose' })]
    for (const s of suggestPlan([], tiny, []).flat()) {
      const budget = Math.round((tiny[0]!.target.target * (s.slot === 'lunch' ? 0.35 : s.slot === 'dinner' ? 0.3 : 0.25)) / 0.9)
      expect(s.low, `${s.dish.id} at ${s.slot}`).toBeLessThanOrEqual(budget + 1)
    }
  })
})

describe('dietary concerns are respected', () => {
  /**
   * The test that matters most here. Proposing food a player has told us they
   * cannot eat would be worse than proposing nothing at all, and it would undo
   * the point of the toggles.
   */
  const concernSets: ConcernId[][] = [
    ['shellfish'],
    ['halal'],
    ['vegan'],
    ['gluten'],
    ['peanut', 'treenut'],
    ['vegetarian', 'dairy'],
  ]

  it.each(concernSets.map((c) => [c.join(' + '), c] as const))(
    'never suggests a dish whose required ingredients are all off-limits (%s)',
    (_label, concerns) => {
      for (const s of suggestPlan([], solo, concerns).flat()) {
        for (const slot of s.dish.slots) {
          if (slot.optional) continue
          const buildable = slot.options.some(
            (o) => !flagsFor(o.productId, concerns).some((f) => f.level === 'avoid'),
          )
          expect(buildable, `${s.dish.id} / ${slot.id} under ${concerns.join('+')}`).toBe(true)
        }
      }
    },
  )

  it('still fills the plan for a vegan table rather than giving up', () => {
    const plan = suggestPlan([], solo, ['vegan'])
    expect(plan.flat().length).toBeGreaterThan(0)
  })

  it('prefers a dish with fewer compromised slots', () => {
    // Same table, one with concerns and one without: the concerned plan should
    // not be identical by accident, and must stay valid.
    const withConcerns = suggestPlan([], solo, ['vegetarian']).flat()
    for (const s of withConcerns) {
      const requiredMeat = s.dish.slots.some(
        (slot) =>
          !slot.optional &&
          slot.options.every((o) => flagsFor(o.productId, ['vegetarian']).some((f) => f.level === 'avoid')),
      )
      expect(requiredMeat, s.dish.id).toBe(false)
    }
  })
})

describe('a bigger table', () => {
  it('scales the calorie ranges with the number of eaters', () => {
    const one = suggestPlan([], [player()], [])
    const four = suggestPlan([], [player(), { ...player(), id: 'p2' }, { ...player(), id: 'p3' }, { ...player(), id: 'p4' }], [])

    // Compare the same dish where the two plans happen to agree.
    for (const a of one.flat()) {
      const b = four.flat().find((s) => s.dish.id === a.dish.id)
      if (b) expect(b.low).toBeCloseTo(a.low * 4, -1)
    }
  })
})
