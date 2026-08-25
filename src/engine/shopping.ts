/**
 * Turns a block of finished days into a shopping list.
 *
 * This is the one thing the game produces that you could actually take to a
 * shop. Nine meals' worth of ingredient choices, merged into one line per
 * product and grouped by aisle, with the quantity already scaled to however
 * many people are eating.
 */

import { CATALOG } from '../data/products'
import { getDish } from '../data/dishes'
import type { Category, Product, Unit } from '../data/types'
import { buildCart } from './cart'
import type { CompletedDay } from '../state/gameReducer'

export interface ShoppingLine {
  product: Product
  /** Total across every meal that used it, in `unit`. */
  amount: number
  unit: Unit
  kcal: number
  /** Which dishes needed it, so a line explains itself. */
  usedIn: string[]
}

export interface Aisle {
  category: Category
  label: string
  lines: ShoppingLine[]
  kcal: number
}

/** Roughly the order you'd walk a shop, produce first. */
export const AISLES: { category: Category; label: string }[] = [
  { category: 'produce', label: 'Fruit & vegetables' },
  { category: 'protein', label: 'Meat, fish & pulses' },
  { category: 'dairy', label: 'Chilled & dairy' },
  { category: 'grain', label: 'Bread, rice & pasta' },
  { category: 'sauce', label: 'Sauces & condiments' },
  { category: 'fat', label: 'Oils & fats' },
  { category: 'pantry', label: 'Store cupboard' },
  { category: 'drink', label: 'Drinks' },
]

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * One line per product *per unit*.
 *
 * A product bought both by weight and by piece stays two lines — silently
 * adding grams to a count of eggs would produce a number that means nothing.
 */
function key(productId: string, unit: Unit): string {
  return `${productId}::${unit}`
}

export function shoppingList(days: readonly CompletedDay[]): ShoppingLine[] {
  const merged = new Map<string, ShoppingLine>()

  for (const day of days) {
    for (const meal of day.meals) {
      const dish = getDish(meal.dishId)
      if (!dish) continue

      // Rebuilding from the stored choices means the quantities come out
      // already scaled by servings, with no second copy of that arithmetic.
      for (const line of buildCart(dish, meal.choices, CATALOG, meal.servings)) {
        const k = key(line.product.id, line.use.unit)
        const amount = line.use.amount * line.servings
        const existing = merged.get(k)

        if (existing) {
          existing.amount = round1(existing.amount + amount)
          existing.kcal += line.kcal
          if (!existing.usedIn.includes(meal.dishName)) existing.usedIn.push(meal.dishName)
        } else {
          merged.set(k, {
            product: line.product,
            amount: round1(amount),
            unit: line.use.unit,
            kcal: line.kcal,
            usedIn: [meal.dishName],
          })
        }
      }
    }
  }

  return [...merged.values()]
}

/** The list grouped into aisles, priciest first within each, empties dropped. */
export function shoppingByAisle(days: readonly CompletedDay[]): Aisle[] {
  const lines = shoppingList(days)

  return AISLES.map(({ category, label }) => {
    const inAisle = lines
      .filter((l) => l.product.category === category)
      .sort((a, b) => b.kcal - a.kcal)
    return {
      category,
      label,
      lines: inAisle,
      kcal: inAisle.reduce((sum, l) => sum + l.kcal, 0),
    }
  }).filter((aisle) => aisle.lines.length > 0)
}

/** How the quantity reads on the list: "540 g", "6 pieces", "45 mL". */
export function formatAmount(line: ShoppingLine): string {
  if (line.unit === 'piece') return line.amount === 1 ? '1 piece' : `${line.amount} pieces`
  return `${line.amount} ${line.unit === 'ml' ? 'mL' : 'g'}`
}

/** Total calories on the list — should reconcile with what the days cooked. */
export function shoppingTotal(days: readonly CompletedDay[]): number {
  return shoppingList(days).reduce((sum, line) => sum + line.kcal, 0)
}
