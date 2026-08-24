/**
 * Core data shapes for the grocery catalogue and the dish recipes that shop from it.
 *
 * The modelling decision that drives everything here: **a grocery pack is not a
 * serving.** A 500 g jar of spaghetti sauce is not what you eat. So a `Product`
 * carries nutrition per some base amount, and each dish declares how much of that
 * product it actually uses (`SlotOption.use`). The store screen shows both numbers,
 * because the gap between them is the most useful thing the game can teach.
 */

export type Unit = 'g' | 'ml' | 'piece'

export interface Qty {
  amount: number
  unit: Unit
}

export type Category =
  | 'produce'
  | 'protein'
  | 'grain'
  | 'dairy'
  | 'sauce'
  | 'fat'
  | 'pantry'
  | 'drink'

/** Descriptive labels used for filtering, colour-coding and coaching lines. */
export type ProductTag =
  | 'fresh'
  | 'frozen'
  | 'canned'
  | 'jarred'
  | 'dried'
  | 'processed'
  | 'wholegrain'
  | 'refined'
  | 'vegetarian'
  | 'vegan'
  | 'lean'
  | 'fatty'
  | 'fried'
  | 'sweetened'
  | 'lowcal'

/** A single product on the shelf. Nutrition figures are *per `basis`*. */
export interface Product {
  id: string
  name: string
  /** Optional shelf brand, purely flavour text. */
  brand?: string
  emoji: string
  category: Category
  /** The amount all the nutrition numbers below refer to. */
  basis: Qty
  kcal: number
  /** Grams of each macro per `basis`. */
  protein: number
  carbs: number
  fat: number
  /** How the product is sold, e.g. "500 g jar". Display only. */
  pack: string
  tags: ProductTag[]
}

/**
 * One shelf option within an ingredient slot, plus how much of it the dish uses.
 *
 * `id` rather than `productId` is what a player's choice refers to, because a
 * slot routinely offers the same product at two different portion sizes — "one
 * cup of rice" and "two cups of rice" are the same product and a completely
 * different decision.
 */
export interface SlotOption {
  /** Unique within its slot. Derived from the product and portion; see `opt()`. */
  id: string
  productId: string
  use: Qty
  /** Short aside shown on the card, e.g. "half the jar". */
  note?: string
}

/** One ingredient decision, presented as a single screen in the store. */
export interface Slot {
  id: string
  /** Short name of the ingredient, e.g. "Spaghetti sauce". */
  label: string
  /** The question put to the player on this screen. */
  prompt: string
  /**
   * Optional slots are garnishes and extras. Required slots can still be skipped —
   * the game warns rather than blocks, because skipping the meat to save calories
   * is a legitimate (and instructive) move.
   */
  optional: boolean
  options: SlotOption[]
}

export type MenuId = 'breakfast' | 'filipino' | 'american' | 'arabic' | 'chinese'

export interface Dish {
  id: string
  name: string
  menu: MenuId
  emoji: string
  /** One line of appetite-building description shown on the menu card. */
  blurb: string
  slots: Slot[]
}

export interface Menu {
  id: MenuId
  name: string
  emoji: string
  blurb: string
}
