/**
 * Data-integrity sweep over the whole catalogue and every dish.
 *
 * The game reads this data at runtime with no schema validation, so a typo in a
 * product id would show up as a silently missing shelf item rather than an
 * error. These tests are the schema.
 */

import { describe, expect, it } from 'vitest'
import { cheapestBuild, priciestBuild } from '../engine/cart'
import { MEAL_ORDER, mealBudgets } from '../engine/calories'
import { CATALOG, PRODUCTS } from './products'
import { MENUS, MENUS_BY_MEAL } from './menus'
import { DISHES, dishesForMenu } from './dishes'

/**
 * A deliberately small daily target — the low end of what the game will ever
 * hand out. Every dish has to be buildable inside a meal budget derived from
 * it, or the menu contains a dish nobody can ever cook.
 */
const LOW_DAILY_TARGET = 1200
const LOW_BUDGETS = mealBudgets(LOW_DAILY_TARGET, ['breakfast', 'lunch', 'dinner'])

describe('product catalogue', () => {
  it('has unique ids', () => {
    const ids = PRODUCTS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('indexes every product in the lookup', () => {
    expect(Object.keys(CATALOG).length).toBe(PRODUCTS.length)
  })

  it('has a positive basis amount for every product', () => {
    for (const p of PRODUCTS) {
      expect(p.basis.amount, p.id).toBeGreaterThan(0)
    }
  })

  it('has non-negative, finite nutrition figures', () => {
    for (const p of PRODUCTS) {
      for (const key of ['kcal', 'protein', 'carbs', 'fat'] as const) {
        expect(Number.isFinite(p[key]), `${p.id}.${key}`).toBe(true)
        expect(p[key], `${p.id}.${key}`).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('has macro calories that roughly match the stated calories', () => {
    // 4/4/9 kcal per gram. Allow a wide tolerance: fibre, alcohol, water content
    // and label rounding all pull these apart, and a few items (spices, sauces)
    // legitimately drift. This catches transposed digits, not honest variation.
    for (const p of PRODUCTS) {
      if (p.kcal < 50) continue // rounding noise dominates at the low end
      const fromMacros = p.protein * 4 + p.carbs * 4 + p.fat * 9
      const ratio = fromMacros / p.kcal
      expect(ratio, `${p.id}: ${fromMacros} kcal from macros vs ${p.kcal} stated`).toBeGreaterThan(0.6)
      expect(ratio, `${p.id}: ${fromMacros} kcal from macros vs ${p.kcal} stated`).toBeLessThan(1.4)
    }
  })

  it('gives every product a name, emoji and pack label', () => {
    for (const p of PRODUCTS) {
      expect(p.name.length, p.id).toBeGreaterThan(0)
      expect(p.emoji.length, p.id).toBeGreaterThan(0)
      expect(p.pack.length, p.id).toBeGreaterThan(0)
    }
  })
})

describe('menus', () => {
  it('offers between 5 and 10 dishes on every menu', () => {
    for (const menu of MENUS) {
      const count = dishesForMenu(menu.id).length
      expect(count, menu.id).toBeGreaterThanOrEqual(5)
      expect(count, menu.id).toBeLessThanOrEqual(10)
    }
  })

  it('points every meal slot at menus that exist and have dishes', () => {
    for (const slot of MEAL_ORDER) {
      const menus = MENUS_BY_MEAL[slot]
      expect(menus.length, slot).toBeGreaterThan(0)
      for (const menuId of menus) {
        expect(MENUS.some((m) => m.id === menuId), `${slot} → ${menuId}`).toBe(true)
        expect(dishesForMenu(menuId).length, menuId).toBeGreaterThan(0)
      }
    }
  })

  it('includes both American and Filipino dishes on the breakfast menu', () => {
    const ids = dishesForMenu('breakfast').map((d) => d.id)
    expect(ids).toContain('tapsilog') // Filipino
    expect(ids).toContain('pancakes') // American
  })
})

describe('dishes', () => {
  it('have unique ids', () => {
    const ids = DISHES.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('have unique slot ids within each dish', () => {
    for (const dish of DISHES) {
      const ids = dish.slots.map((s) => s.id)
      expect(new Set(ids).size, dish.id).toBe(ids.length)
    }
  })

  it('have unique option ids within each slot', () => {
    for (const dish of DISHES) {
      for (const slot of dish.slots) {
        const ids = slot.options.map((o) => o.id)
        expect(new Set(ids).size, `${dish.id}/${slot.id}: ${ids.join(', ')}`).toBe(ids.length)
      }
    }
  })

  it('reference only products that exist in the catalogue', () => {
    for (const dish of DISHES) {
      for (const slot of dish.slots) {
        for (const option of slot.options) {
          expect(CATALOG[option.productId], `${dish.id}/${slot.id} → ${option.productId}`).toBeDefined()
        }
      }
    }
  })

  it('offer at least two options in every slot, so there is always a decision', () => {
    for (const dish of DISHES) {
      for (const slot of dish.slots) {
        expect(slot.options.length, `${dish.id}/${slot.id}`).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('have between 4 and 10 ingredient slots', () => {
    for (const dish of DISHES) {
      expect(dish.slots.length, dish.id).toBeGreaterThanOrEqual(4)
      expect(dish.slots.length, dish.id).toBeLessThanOrEqual(10)
    }
  })

  it('use a positive amount of every option', () => {
    for (const dish of DISHES) {
      for (const slot of dish.slots) {
        for (const option of slot.options) {
          expect(option.use.amount, `${dish.id}/${slot.id}/${option.id}`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('measure each option in a unit the product is actually sold in', () => {
    // Grams and millilitres are interchangeable for our purposes (water-density
    // approximation), but a per-piece product measured in grams would silently
    // price a single egg as if it were 100 eggs.
    for (const dish of DISHES) {
      for (const slot of dish.slots) {
        for (const option of slot.options) {
          const product = CATALOG[option.productId]!
          const bothPieces = product.basis.unit === 'piece' && option.use.unit === 'piece'
          const neitherPiece = product.basis.unit !== 'piece' && option.use.unit !== 'piece'
          expect(
            bothPieces || neitherPiece,
            `${dish.id}/${slot.id}/${option.id}: product is per ${product.basis.unit}, recipe uses ${option.use.unit}`,
          ).toBe(true)
        }
      }
    }
  })

  it('give every dish a name, emoji and blurb', () => {
    for (const dish of DISHES) {
      expect(dish.name.length, dish.id).toBeGreaterThan(0)
      expect(dish.emoji.length, dish.id).toBeGreaterThan(0)
      expect(dish.blurb.length, dish.id).toBeGreaterThan(0)
    }
  })

  it('give every slot a label and a prompt', () => {
    for (const dish of DISHES) {
      for (const slot of dish.slots) {
        expect(slot.label.length, `${dish.id}/${slot.id}`).toBeGreaterThan(0)
        expect(slot.prompt.length, `${dish.id}/${slot.id}`).toBeGreaterThan(0)
      }
    }
  })
})

describe('playability', () => {
  it('is buildable on the smallest budget the game will ever hand out', () => {
    for (const dish of DISHES) {
      const budget = dish.menu === 'breakfast' ? LOW_BUDGETS.breakfast : LOW_BUDGETS.dinner
      expect(
        cheapestBuild(dish, CATALOG),
        `${dish.id}: cheapest build is ${cheapestBuild(dish, CATALOG)} kcal, budget is ${budget}`,
      ).toBeLessThanOrEqual(budget)
    }
  })

  it('can be overspent, so the budget is a real constraint', () => {
    // If the most extravagant possible build still fits comfortably, the dish
    // poses no decision at all.
    for (const dish of DISHES) {
      const budget = dish.menu === 'breakfast' ? LOW_BUDGETS.breakfast : LOW_BUDGETS.dinner
      expect(priciestBuild(dish, CATALOG), dish.id).toBeGreaterThan(budget)
    }
  })

  it('has a meaningful spread between the cheapest and priciest build', () => {
    for (const dish of DISHES) {
      const low = cheapestBuild(dish, CATALOG)
      const high = priciestBuild(dish, CATALOG)
      expect(high - low, `${dish.id}: ${low}–${high} kcal`).toBeGreaterThanOrEqual(200)
    }
  })
})
