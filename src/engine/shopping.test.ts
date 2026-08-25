import { describe, expect, it } from 'vitest'
import { getDish } from '../data/dishes'
import { CATALOG } from '../data/products'
import { buildCart, cartTotals } from './cart'
import { gradeDay, gradeMeal } from './nutrition'
import type { CompletedDay, CompletedMeal } from '../state/gameReducer'
import { formatAmount, shoppingByAisle, shoppingList, shoppingTotal } from './shopping'

/** Builds a finished meal the way the reducer would, from real dish data. */
function meal(dishId: string, slot: CompletedMeal['slot'], servings = 1): CompletedMeal {
  const dish = getDish(dishId)!
  // Take the first option in every slot — a deterministic, fully-populated cart.
  const choices = Object.fromEntries(dish.slots.map((s) => [s.id, s.options[0]!.id]))
  const lines = buildCart(dish, choices, CATALOG, servings)
  const totals = cartTotals(lines)
  return {
    slot,
    dishId,
    dishName: dish.name,
    dishEmoji: dish.emoji,
    choices,
    totals,
    budget: 10_000,
    servings,
    verdict: gradeMeal(lines, totals, 10_000),
  }
}

function day(meals: CompletedMeal[]): CompletedDay {
  return { meals, target: 30_000, verdict: gradeDay(meals, 30_000) }
}

const oneDay = [day([meal('tapsilog', 'breakfast'), meal('adobo', 'lunch'), meal('adobo', 'dinner')])]

describe('shoppingList', () => {
  it('is empty for a block with no days', () => {
    expect(shoppingList([])).toEqual([])
    expect(shoppingByAisle([])).toEqual([])
  })

  it('merges a product used by two meals into one line', () => {
    // Adobo is cooked twice above, so every one of its ingredients doubles
    // rather than appearing as two separate lines.
    const single = shoppingList([day([meal('adobo', 'lunch')])])
    const twice = shoppingList([day([meal('adobo', 'lunch'), meal('adobo', 'dinner')])])

    expect(twice).toHaveLength(single.length)
    for (const line of twice) {
      const before = single.find((l) => l.product.id === line.product.id && l.unit === line.unit)!
      expect(line.amount, line.product.id).toBeCloseTo(before.amount * 2, 1)
      expect(line.kcal, line.product.id).toBe(before.kcal * 2)
    }
  })

  it('names every dish a line was bought for', () => {
    const list = shoppingList(oneDay)
    const rice = list.find((l) => l.product.id === 'rice-white')
    expect(rice).toBeDefined()
    expect(rice!.usedIn.length).toBeGreaterThan(1)
    expect(new Set(rice!.usedIn).size, 'a dish should not be listed twice').toBe(rice!.usedIn.length)
  })

  it('scales with servings, so a bigger table buys more', () => {
    const solo = shoppingList([day([meal('adobo', 'lunch', 1)])])
    const four = shoppingList([day([meal('adobo', 'lunch', 4)])])

    for (const line of four) {
      const one = solo.find((l) => l.product.id === line.product.id && l.unit === line.unit)!
      expect(line.amount, line.product.id).toBeCloseTo(one.amount * 4, 1)
    }
  })

  it('keeps the same product separate when it is bought in different units', () => {
    // Grams added to a count of pieces would produce a number meaning nothing.
    const list = shoppingList(oneDay)
    const byProduct = new Map<string, Set<string>>()
    for (const line of list) {
      if (!byProduct.has(line.product.id)) byProduct.set(line.product.id, new Set())
      byProduct.get(line.product.id)!.add(line.unit)
    }
    for (const line of list) {
      const units = byProduct.get(line.product.id)!
      // Whatever the units, each (product, unit) pair appears exactly once.
      const matching = list.filter((l) => l.product.id === line.product.id && l.unit === line.unit)
      expect(matching, `${line.product.id} ${line.unit}`).toHaveLength(1)
      expect(units.has(line.unit)).toBe(true)
    }
  })

  it('leaves out ingredients the player skipped', () => {
    const dish = getDish('adobo')!
    const skipped = dish.slots[0]!
    const base = meal('adobo', 'lunch')
    const withSkip: CompletedMeal = { ...base, choices: { ...base.choices, [skipped.id]: null } }

    const ids = shoppingList([day([withSkip])]).map((l) => l.product.id)
    const skippedProduct = skipped.options[0]!.productId
    // Only assert absence if nothing else in the dish also buys that product.
    const stillNeeded = dish.slots
      .filter((s) => s.id !== skipped.id)
      .some((s) => s.options[0]!.productId === skippedProduct)
    if (!stillNeeded) expect(ids).not.toContain(skippedProduct)
  })

  it('adds up to exactly what the meals cooked', () => {
    // The list is the same food seen a different way, so the calories must
    // reconcile — otherwise one of the two views is lying.
    const cooked = oneDay.flatMap((d) => d.meals).reduce((sum, m) => sum + m.totals.kcal, 0)
    expect(shoppingTotal(oneDay)).toBe(cooked)
  })

  it('ignores a meal whose dish no longer exists rather than throwing', () => {
    const broken = day([{ ...meal('adobo', 'lunch'), dishId: 'deleted-dish' }])
    expect(() => shoppingList([broken])).not.toThrow()
    expect(shoppingList([broken])).toEqual([])
  })
})

describe('shoppingByAisle', () => {
  it('groups every line into an aisle and loses none', () => {
    const flat = shoppingList(oneDay)
    const grouped = shoppingByAisle(oneDay)
    const regrouped = grouped.flatMap((a) => a.lines)
    expect(regrouped).toHaveLength(flat.length)
  })

  it('never returns an empty aisle', () => {
    for (const aisle of shoppingByAisle(oneDay)) {
      expect(aisle.lines.length, aisle.label).toBeGreaterThan(0)
    }
  })

  it('puts produce before the store cupboard, as you would walk a shop', () => {
    const labels = shoppingByAisle(oneDay).map((a) => a.category)
    const produce = labels.indexOf('produce')
    const pantry = labels.indexOf('pantry')
    if (produce !== -1 && pantry !== -1) expect(produce).toBeLessThan(pantry)
  })

  it('sorts the priciest item to the top of its aisle', () => {
    for (const aisle of shoppingByAisle(oneDay)) {
      const kcals = aisle.lines.map((l) => l.kcal)
      expect([...kcals].sort((a, b) => b - a), aisle.label).toEqual(kcals)
    }
  })

  it('totals each aisle to the sum of its lines', () => {
    for (const aisle of shoppingByAisle(oneDay)) {
      expect(aisle.kcal, aisle.label).toBe(aisle.lines.reduce((s, l) => s + l.kcal, 0))
    }
  })
})

describe('formatAmount', () => {
  const line = (amount: number, unit: 'g' | 'ml' | 'piece') =>
    ({ amount, unit }) as Parameters<typeof formatAmount>[0]

  it('reads naturally per unit', () => {
    expect(formatAmount(line(540, 'g'))).toBe('540 g')
    expect(formatAmount(line(45, 'ml'))).toBe('45 mL')
    expect(formatAmount(line(1, 'piece'))).toBe('1 piece')
    expect(formatAmount(line(6, 'piece'))).toBe('6 pieces')
  })
})
