/**
 * Shorthand for authoring dish recipes, plus factories for the ingredient slots
 * that show up in nearly every dish (oil, rice, a drink). Keeping those in one
 * place means a change to the rice options lands in all 30-odd dishes that
 * serve rice.
 */

import type { Qty, Slot, SlotOption } from '../types'

export const g = (amount: number): Qty => ({ amount, unit: 'g' })
export const ml = (amount: number): Qty => ({ amount, unit: 'ml' })
export const pc = (amount: number): Qty => ({ amount, unit: 'piece' })

/**
 * Builds a slot option, deriving a readable id from the product and portion so
 * that "one cup of rice" and "two cups of rice" stay distinguishable. Any
 * remaining collision inside a slot is caught by the data-integrity test.
 */
export function opt(productId: string, use: Qty, note?: string): SlotOption {
  const id = `${productId}-${use.amount}${use.unit}`
  return note === undefined ? { id, productId, use } : { id, productId, use, note }
}

/**
 * The cooking-fat decision. Small amounts, big numbers — a tablespoon of oil
 * costs more than a whole bowl of vegetables, which is exactly the sort of thing
 * players don't expect.
 */
export function oilSlot(amountMl = 10): Slot {
  return {
    id: 'oil',
    label: 'Cooking fat',
    prompt: 'What are you cooking it in?',
    optional: true,
    options: [
      opt('oil-vegetable', ml(amountMl), 'about a tablespoon'),
      opt('oil-olive', ml(amountMl), 'about a tablespoon'),
      opt('butter', g(amountMl), 'about a tablespoon'),
      opt('cooking-spray', ml(2), 'a couple of seconds'),
    ],
  }
}

/** Rice, in the amounts people actually serve. Weights are uncooked. */
export function riceSlot(): Slot {
  return {
    id: 'rice',
    label: 'Rice',
    prompt: 'How much rice, and which kind?',
    optional: true,
    options: [
      opt('rice-white', g(60), 'one cup cooked'),
      opt('rice-white', g(120), 'two cups cooked'),
      opt('rice-brown', g(60), 'one cup cooked'),
      opt('rice-white', g(30), 'half a cup cooked'),
    ],
  }
}

/** The drink nobody counts. Usually the cheapest calories to give up. */
export function drinkSlot(): Slot {
  return {
    id: 'drink',
    label: 'Something to drink',
    prompt: 'Anything to wash it down?',
    optional: true,
    options: [
      opt('water', ml(330), 'free, always'),
      opt('cola', ml(330), 'one can'),
      opt('cola-diet', ml(330), 'one can'),
      opt('iced-tea', ml(250), 'one glass'),
      opt('orange-juice', ml(250), 'one glass'),
    ],
  }
}

/** Onion, garlic and friends: cheap flavour, and a place to add a vegetable. */
export function aromaticsSlot(): Slot {
  return {
    id: 'aromatics',
    label: 'Aromatics',
    prompt: 'Building the base — what goes in first?',
    optional: true,
    options: [
      opt('onion', g(60), 'one small onion'),
      opt('garlic', g(15), 'three cloves'),
      opt('scallion', g(30), 'a small handful'),
      opt('ginger', g(15), 'a thumb'),
    ],
  }
}
