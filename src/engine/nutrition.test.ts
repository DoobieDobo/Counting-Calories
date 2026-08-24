import { describe, expect, it } from 'vitest'
import type { CartLine, CartTotals } from './cart'
import { gradeDay, gradeMeal, macroSplit, produceLines } from './nutrition'

function line(over: Partial<CartLine> & { category: CartLine['product']['category'] }): CartLine {
  const { category, ...rest } = over
  return {
    slotId: 's',
    slotLabel: 'Slot',
    optionId: 'p-100g',
    use: { amount: 100, unit: 'g' },
    kcal: 100,
    protein: 5,
    carbs: 10,
    fat: 3,
    product: {
      id: 'p',
      name: 'Product',
      emoji: '🍽️',
      category,
      basis: { amount: 100, unit: 'g' },
      kcal: 100,
      protein: 5,
      carbs: 10,
      fat: 3,
      pack: '1 pack',
      tags: [],
    },
    ...rest,
  }
}

describe('macroSplit', () => {
  it('splits calories by macro, always summing to 1', () => {
    // 25 g protein (100 kcal), 25 g carbs (100 kcal), 100/9 g fat (100 kcal)
    const split = macroSplit({ kcal: 300, protein: 25, carbs: 25, fat: 100 / 9 })
    expect(split.protein).toBeCloseTo(1 / 3, 5)
    expect(split.carbs).toBeCloseTo(1 / 3, 5)
    expect(split.fat).toBeCloseTo(1 / 3, 5)
    expect(split.protein + split.carbs + split.fat).toBeCloseTo(1, 10)
  })

  it('returns zeroes for an empty plate instead of NaN', () => {
    expect(macroSplit({ kcal: 0, protein: 0, carbs: 0, fat: 0 })).toEqual({
      protein: 0,
      carbs: 0,
      fat: 0,
    })
  })
})

describe('produceLines', () => {
  it('counts only fresh produce', () => {
    const lines = [line({ category: 'produce' }), line({ category: 'produce' }), line({ category: 'protein' })]
    expect(produceLines(lines)).toBe(2)
  })
})

describe('gradeMeal', () => {
  const balanced: CartTotals = { kcal: 560, protein: 40, carbs: 55, fat: 15 }

  it('grades a well-judged, balanced, vegetable-bearing meal highly', () => {
    const lines = [line({ category: 'produce' }), line({ category: 'produce' }), line({ category: 'protein' })]
    const verdict = gradeMeal(lines, balanced, 600)
    expect(verdict.grade).toBe('A')
    expect(verdict.overBudget).toBe(false)
    expect(verdict.remaining).toBe(40)
  })

  it('fails any meal that goes over budget, however well balanced', () => {
    const lines = [line({ category: 'produce' }), line({ category: 'protein' })]
    const verdict = gradeMeal(lines, { ...balanced, kcal: 700 }, 600)
    expect(verdict.grade).toBe('D')
    expect(verdict.overBudget).toBe(true)
    expect(verdict.remaining).toBe(-100)
    expect(verdict.notes[0]).toContain('100 calories over')
  })

  it('does not reward starving: a near-empty plate scores poorly and says so', () => {
    const verdict = gradeMeal([], { kcal: 90, protein: 2, carbs: 20, fat: 0.5 }, 600)
    expect(verdict.grade).not.toBe('A')
    expect(verdict.notes.join(' ')).toMatch(/not a high score|empty plate/i)
  })

  it('calls out a meal that is mostly fat', () => {
    const lines = [line({ category: 'protein' })]
    // 40 g fat = 360 kcal of a 500 kcal meal.
    const verdict = gradeMeal(lines, { kcal: 500, protein: 10, carbs: 15, fat: 40 }, 600)
    expect(verdict.notes.join(' ')).toMatch(/from fat/i)
  })

  it('calls out a cart with nothing fresh in it', () => {
    const lines = [line({ category: 'grain' }), line({ category: 'sauce' })]
    const verdict = gradeMeal(lines, balanced, 600)
    expect(verdict.notes.join(' ')).toMatch(/Nothing fresh/i)
  })

  it('handles a zero budget without dividing by zero', () => {
    const verdict = gradeMeal([], { kcal: 0, protein: 0, carbs: 0, fat: 0 }, 0)
    expect(Number.isFinite(verdict.usage)).toBe(true)
  })
})

describe('gradeDay', () => {
  const meal = (kcal: number): { totals: CartTotals } => ({
    totals: { kcal, protein: kcal / 20, carbs: kcal / 10, fat: kcal / 45 },
  })

  it('grades landing on the daily target an A', () => {
    const verdict = gradeDay([meal(500), meal(700), meal(800)], 2000)
    expect(verdict.kcal).toBe(2000)
    expect(verdict.grade).toBe('A')
    expect(verdict.remaining).toBe(0)
  })

  it('grades a big overshoot poorly and says so without shaming', () => {
    const verdict = gradeDay([meal(1200), meal(1200), meal(1200)], 2000)
    expect(verdict.grade).toBe('D')
    expect(verdict.note).toContain('over')
    expect(verdict.note).toMatch(/pattern that counts/i)
  })

  it('flags a big undershoot as its own problem', () => {
    const verdict = gradeDay([meal(300), meal(300), meal(300)], 2000)
    expect(verdict.note).toMatch(/under-eating/i)
  })

  it('sums an empty day to zero without throwing', () => {
    const verdict = gradeDay([], 2000)
    expect(verdict.kcal).toBe(0)
  })
})
