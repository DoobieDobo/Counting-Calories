import { describe, expect, it } from 'vitest'
import type { Dish, Product } from '../data/types'
import {
  bestSwap,
  buildCart,
  canAfford,
  cartTotals,
  cheapestBuild,
  optionKcal,
  optionNutrition,
  priciestBuild,
  useRatio,
} from './cart'

const catalog: Record<string, Product> = {
  'sauce-pinoy': {
    id: 'sauce-pinoy',
    name: 'Pinoy-style sweet spaghetti sauce',
    emoji: '🫙',
    category: 'sauce',
    basis: { amount: 100, unit: 'g' },
    kcal: 120,
    protein: 1.5,
    carbs: 26,
    fat: 1,
    pack: '1 kg jar',
    tags: ['jarred', 'sweetened'],
  },
  'sauce-canned-tomato': {
    id: 'sauce-canned-tomato',
    name: 'Canned crushed tomatoes',
    emoji: '🥫',
    category: 'sauce',
    basis: { amount: 100, unit: 'g' },
    kcal: 32,
    protein: 1.6,
    carbs: 7,
    fat: 0.3,
    pack: '400 g can',
    tags: ['canned'],
  },
  'pasta-white': {
    id: 'pasta-white',
    name: 'Spaghetti',
    emoji: '🍝',
    category: 'grain',
    basis: { amount: 100, unit: 'g' },
    kcal: 158,
    protein: 5.8,
    carbs: 31,
    fat: 0.9,
    pack: '500 g pack',
    tags: ['refined'],
  },
  cheese: {
    id: 'cheese',
    name: 'Grated cheddar',
    emoji: '🧀',
    category: 'dairy',
    basis: { amount: 100, unit: 'g' },
    kcal: 402,
    protein: 25,
    carbs: 1.3,
    fat: 33,
    pack: '200 g bag',
    tags: ['processed', 'fatty'],
  },
}

const dish: Dish = {
  id: 'spaghetti',
  name: 'Filipino spaghetti',
  menu: 'filipino',
  emoji: '🍝',
  blurb: 'Sweet, red, and non-negotiable at birthdays.',
  slots: [
    {
      id: 'pasta',
      label: 'Pasta',
      prompt: 'Pick your noodles',
      optional: false,
      options: [{ id: 'pasta-white-100g', productId: 'pasta-white', use: { amount: 100, unit: 'g' } }],
    },
    {
      id: 'sauce',
      label: 'Sauce',
      prompt: 'Pick your sauce',
      optional: false,
      options: [
        { id: 'sauce-pinoy-200g', productId: 'sauce-pinoy', use: { amount: 200, unit: 'g' }, note: 'the sweet one' },
        { id: 'sauce-canned-tomato-200g', productId: 'sauce-canned-tomato', use: { amount: 200, unit: 'g' } },
      ],
    },
    {
      id: 'topping',
      label: 'Cheese',
      prompt: 'Anything on top?',
      optional: true,
      options: [{ id: 'cheese-30g', productId: 'cheese', use: { amount: 30, unit: 'g' } }],
    },
  ],
}

/**
 * A slot offering the same product at two portion sizes — the case that forces
 * choices to key on the option id rather than the product id.
 */
const portionsDish: Dish = {
  ...dish,
  slots: [
    {
      id: 'pasta',
      label: 'Pasta',
      prompt: 'How much?',
      optional: false,
      options: [
        { id: 'pasta-white-100g', productId: 'pasta-white', use: { amount: 100, unit: 'g' }, note: 'a full serving' },
        { id: 'pasta-white-60g', productId: 'pasta-white', use: { amount: 60, unit: 'g' }, note: 'a smaller serving' },
      ],
    },
  ],
}

describe('option pricing', () => {
  it('prices a portion as a fraction of the pack, not the whole pack', () => {
    // 200 g of a sauce listed at 120 kcal per 100 g.
    expect(useRatio(catalog['sauce-pinoy']!, { amount: 200, unit: 'g' })).toBe(2)
    expect(optionKcal(catalog['sauce-pinoy']!, { amount: 200, unit: 'g' })).toBe(240)
  })

  it('scales every macro by the same ratio', () => {
    const n = optionNutrition(catalog.cheese!, { amount: 50, unit: 'g' })
    expect(n.kcal).toBe(201)
    expect(n.protein).toBeCloseTo(12.5, 5)
    expect(n.fat).toBeCloseTo(16.5, 5)
  })

  it('prices a zero-basis product at zero rather than dividing by zero', () => {
    const broken: Product = { ...catalog.cheese!, basis: { amount: 0, unit: 'g' } }
    expect(optionKcal(broken, { amount: 30, unit: 'g' })).toBe(0)
  })
})

describe('buildCart', () => {
  it('resolves choices into lines in slot order', () => {
    const lines = buildCart(dish, { pasta: 'pasta-white-100g', sauce: 'sauce-pinoy-200g' }, catalog)
    expect(lines.map((l) => l.slotId)).toEqual(['pasta', 'sauce'])
    expect(lines[1]!.kcal).toBe(240)
  })

  it('omits skipped slots (null) and unreached slots (undefined) alike', () => {
    const lines = buildCart(dish, { pasta: 'pasta-white-100g', sauce: null }, catalog)
    expect(lines.map((l) => l.slotId)).toEqual(['pasta'])
  })

  it('ignores a choice that is not an option in that slot', () => {
    const lines = buildCart(dish, { pasta: 'cheese-30g' }, catalog)
    expect(lines).toHaveLength(0)
  })

  it('ignores a choice whose product is missing from the catalog', () => {
    const lines = buildCart(dish, { pasta: 'pasta-white-100g' }, { 'pasta-white': undefined } as never)
    expect(lines).toHaveLength(0)
  })

  it('distinguishes two portions of the same product', () => {
    expect(cartTotals(buildCart(portionsDish, { pasta: 'pasta-white-60g' }, catalog)).kcal).toBe(95)
    expect(cartTotals(buildCart(portionsDish, { pasta: 'pasta-white-100g' }, catalog)).kcal).toBe(158)
  })
})

describe('cartTotals', () => {
  it('sums calories and macros across lines', () => {
    const lines = buildCart(
      dish,
      { pasta: 'pasta-white-100g', sauce: 'sauce-canned-tomato-200g', topping: 'cheese-30g' },
      catalog,
    )
    const totals = cartTotals(lines)
    // 158 + 64 + 121 (30 g of 402/100 g rounds to 121)
    expect(totals.kcal).toBe(158 + 64 + 121)
    expect(totals.protein).toBeCloseTo(5.8 + 3.2 + 7.5, 1)
  })

  it('returns zeroes for an empty cart', () => {
    expect(cartTotals([])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 })
  })
})

describe('canAfford', () => {
  it('allows spending exactly the budget', () => {
    expect(canAfford(500, 500)).toBe(true)
  })

  it('rejects one calorie over', () => {
    expect(canAfford(501, 500)).toBe(false)
  })

  it('allows an empty cart against any budget', () => {
    expect(canAfford(0, 0)).toBe(true)
  })
})

describe('bestSwap', () => {
  it('finds the single biggest saving available', () => {
    const hint = bestSwap(dish, { pasta: 'pasta-white-100g', sauce: 'sauce-pinoy-200g', topping: 'cheese-30g' }, catalog)
    expect(hint).not.toBeNull()
    expect(hint!.slotId).toBe('sauce')
    expect(hint!.optionId).toBe('sauce-canned-tomato-200g')
    expect(hint!.toName).toBe('Canned crushed tomatoes')
    expect(hint!.saving).toBe(240 - 64)
  })

  it('names the portion when two options share a product, so the hint is not a tautology', () => {
    // The same product at two portion sizes is a real and common choice — one
    // cup of rice or two. A hint reading "swap rice for rice" would be useless,
    // so the portion note has to carry the meaning.
    const hint = bestSwap(portionsDish, { pasta: 'pasta-white-100g' }, catalog)
    expect(hint!.fromName).toBe('Spaghetti (a full serving)')
    expect(hint!.toName).toBe('Spaghetti (a smaller serving)')
    expect(hint!.saving).toBe(158 - 95)
  })

  it('returns null when every choice is already the cheapest in its slot', () => {
    const hint = bestSwap(dish, { pasta: 'pasta-white-100g', sauce: 'sauce-canned-tomato-200g' }, catalog)
    expect(hint).toBeNull()
  })

  it('returns null for an empty cart', () => {
    expect(bestSwap(dish, {}, catalog)).toBeNull()
  })
})

describe('build bounds', () => {
  it('cheapest build takes the low option in each required slot and skips optional ones', () => {
    // pasta 158 + cheapest sauce 64; cheese slot is optional, so it costs nothing.
    expect(cheapestBuild(dish, catalog)).toBe(158 + 64)
  })

  it('priciest build takes the high option everywhere including optional slots', () => {
    expect(priciestBuild(dish, catalog)).toBe(158 + 240 + 121)
  })

  it('bounds the real thing: cheapest never exceeds priciest', () => {
    expect(cheapestBuild(dish, catalog)).toBeLessThanOrEqual(priciestBuild(dish, catalog))
  })
})
