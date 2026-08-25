/**
 * Cart arithmetic: what a shelf choice costs, what the cart adds up to, and
 * whether the player can afford to check out.
 */

import type { Dish, Product, Qty, Slot, SlotOption } from '../data/types'

/** A resolved choice sitting in the cart: which slot, which product, how much. */
export interface CartLine {
  slotId: string
  slotLabel: string
  optionId: string
  product: Product
  /** Per-serving amount, as authored. Multiply by `servings` for the real total. */
  use: Qty
  servings: number
  note?: string
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export interface CartTotals {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

/**
 * A slot decision, keyed by slot id and holding the chosen *option* id.
 *
 * `null` means the player deliberately skipped the ingredient; a missing key
 * means they haven't reached that slot yet. The distinction matters for the
 * "you skipped the protein" warning on the cart screen.
 */
export type Choices = Record<string, string | null>

/**
 * Fraction of a product's basis amount that a slot option uses.
 *
 * Recipes are authored for one serving, so `servings` scales them for the whole
 * table. This has to move in lockstep with the budget: co-op pools every
 * player's calories into one pot, and cooking a single portion out of a pot that
 * size would make every meal come in absurdly under budget.
 *
 * Units are expected to match — the data-integrity test enforces that — but a
 * mismatch falls back to a straight ratio rather than throwing, so one bad data
 * entry can't take the whole store down mid-game.
 */
export function portionRatio(product: Product, use: Qty, servings = 1): number {
  if (product.basis.amount <= 0) return 0
  return (use.amount * servings) / product.basis.amount
}

/** What this shelf option costs the table, in calories, for this dish. */
export function optionKcal(product: Product, use: Qty, servings = 1): number {
  return Math.round(product.kcal * portionRatio(product, use, servings))
}

/** Full nutrition for one shelf option at the amount the dish uses. */
export function optionNutrition(product: Product, use: Qty, servings = 1): CartTotals {
  const r = portionRatio(product, use, servings)
  return {
    kcal: Math.round(product.kcal * r),
    protein: round1(product.protein * r),
    carbs: round1(product.carbs * r),
    fat: round1(product.fat * r),
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function findOption(slot: Slot, optionId: string): SlotOption | undefined {
  return slot.options.find((o) => o.id === optionId)
}

/** Resolves the player's choices into priced cart lines, in slot order. */
export function buildCart(
  dish: Dish,
  choices: Choices,
  catalog: Record<string, Product>,
  servings = 1,
): CartLine[] {
  const lines: CartLine[] = []

  for (const slot of dish.slots) {
    const optionId = choices[slot.id]
    if (!optionId) continue // undefined (not reached) or null (skipped)

    const option = findOption(slot, optionId)
    const product = option ? catalog[option.productId] : undefined
    if (!option || !product) continue

    const n = optionNutrition(product, option.use, servings)
    lines.push({
      slotId: slot.id,
      slotLabel: slot.label,
      optionId: option.id,
      product,
      use: option.use,
      servings,
      ...(option.note === undefined ? {} : { note: option.note }),
      ...n,
    })
  }

  return lines
}

export function cartTotals(lines: readonly CartLine[]): CartTotals {
  return lines.reduce<CartTotals>(
    (acc, line) => ({
      kcal: acc.kcal + line.kcal,
      protein: round1(acc.protein + line.protein),
      carbs: round1(acc.carbs + line.carbs),
      fat: round1(acc.fat + line.fat),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

/**
 * Spending exactly the budget is a clean checkout — the comparison is
 * deliberately `<=`, not `<`. Landing on the number should feel like a win.
 */
export function canAfford(totalKcal: number, budget: number): boolean {
  return totalKcal <= budget
}

export interface SwapHint {
  slotId: string
  slotLabel: string
  optionId: string
  fromName: string
  toName: string
  saving: number
}

/**
 * How an option reads in a sentence. Two options can share a product name and
 * differ only in portion, so the portion note is what makes the hint useful:
 * "swap two cups of rice for one cup", not "swap rice for rice".
 */
export function describeOption(product: Product, option: SlotOption): string {
  return option.note ? `${product.name} (${option.note})` : product.name
}

/**
 * How the portion reads on a product card: "180 g", "2 pieces", "30 mL".
 * Scaled to the whole table, so what's shown is what actually goes in the pot.
 */
export function formatQty(use: Qty, servings = 1): string {
  const amount = round1(use.amount * servings)
  if (use.unit === 'piece') return amount === 1 ? '1 piece' : `${amount} pieces`
  return `${amount} ${use.unit === 'ml' ? 'mL' : 'g'}`
}

/**
 * When checkout is blocked, find the single swap that saves the most calories,
 * so the game can say something concrete instead of "you're over budget".
 *
 * Only considers swapping to a cheaper option in the same slot; skipping is
 * always available to the player anyway and is a worse suggestion to lead with.
 */
export function bestSwap(
  dish: Dish,
  choices: Choices,
  catalog: Record<string, Product>,
  servings = 1,
): SwapHint | null {
  let best: SwapHint | null = null

  for (const slot of dish.slots) {
    const chosenId = choices[slot.id]
    if (!chosenId) continue

    const chosenOption = findOption(slot, chosenId)
    const chosenProduct = chosenOption ? catalog[chosenOption.productId] : undefined
    if (!chosenOption || !chosenProduct) continue

    const chosenKcal = optionKcal(chosenProduct, chosenOption.use, servings)

    for (const option of slot.options) {
      if (option.id === chosenId) continue
      const product = catalog[option.productId]
      if (!product) continue

      const saving = chosenKcal - optionKcal(product, option.use, servings)
      if (saving > 0 && (!best || saving > best.saving)) {
        best = {
          slotId: slot.id,
          slotLabel: slot.label,
          optionId: option.id,
          fromName: describeOption(chosenProduct, chosenOption),
          toName: describeOption(product, option),
          saving,
        }
      }
    }
  }

  return best
}

/** Cheapest possible full build of a dish — used to prove every dish is playable. */
export function cheapestBuild(
  dish: Dish,
  catalog: Record<string, Product>,
  servings = 1,
): number {
  return dish.slots.reduce((sum, slot) => {
    if (slot.optional) return sum // an optional slot's floor is zero: skip it
    const costs = slot.options
      .map((o) => {
        const product = catalog[o.productId]
        return product ? optionKcal(product, o.use, servings) : Infinity
      })
      .filter((c) => Number.isFinite(c))
    return costs.length === 0 ? sum : sum + Math.min(...costs)
  }, 0)
}

/** Priciest full build — the "everything, and make it fried" ceiling. */
export function priciestBuild(
  dish: Dish,
  catalog: Record<string, Product>,
  servings = 1,
): number {
  return dish.slots.reduce((sum, slot) => {
    const costs = slot.options
      .map((o) => {
        const product = catalog[o.productId]
        return product ? optionKcal(product, o.use, servings) : 0
      })
      .filter((c) => Number.isFinite(c))
    return costs.length === 0 ? sum : sum + Math.max(...costs)
  }, 0)
}
