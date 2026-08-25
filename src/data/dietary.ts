/**
 * Opt-in dietary concerns: things a player wants flagged on the shelf.
 *
 * One mechanism, many concerns. Each concern lists the products it flags,
 * grouped by the reason they're flagged, so the whole judgement for a concern
 * can be read and audited in one block. Anything not listed is not flagged —
 * that default is what keeps every vegetable, grain and legume clean without
 * mass edits to `products.ts`.
 *
 * ── Two things this file has to get right ──────────────────────────────────
 *
 * **Gout is not purine content.** Purine-rich *vegetables* — spinach,
 * mushrooms, cauliflower, peas, lentils — are not associated with gout attacks
 * in cohort studies, while meat and seafood clearly are; dairy is protective;
 * and sugary drinks raise urate through fructose while containing no purines at
 * all. Flagging by purine content would warn against monggo and lentils, which
 * is both wrong and would push players away from the cheap, filling choices the
 * rest of the game exists to teach.
 *
 * **This is not certification.** `halal` here means "contains pork or alcohol",
 * not "certified halal". Allergen flags come from obvious ingredients, not from
 * how a thing was manufactured or what it shared a production line with. For a
 * real allergy that distinction matters, so the UI says it where the toggles
 * are.
 *
 * Adding a concern is a data-only change: append to CONCERNS and the toggles,
 * badges, checkout notice and tests all pick it up.
 */

import { CATALOG } from './products'

export type ConcernId =
  | 'gout'
  | 'halal'
  | 'peanut'
  | 'treenut'
  | 'shellfish'
  | 'fish'
  | 'dairy'
  | 'egg'
  | 'soy'
  | 'gluten'
  | 'sesame'
  | 'lactose'
  | 'fructose'
  | 'caffeine'
  | 'fodmap'
  | 'vegetarian'
  | 'vegan'

export type ConcernGroup = 'health' | 'faith' | 'allergy' | 'intolerance' | 'diet'

export type FlagLevel = 'avoid' | 'caution'

/** A set of products flagged for the same reason. */
interface FlagGroup {
  level: FlagLevel
  why: string
  ids: readonly string[]
}

export interface Concern {
  id: ConcernId
  label: string
  group: ConcernGroup
  /** Shown beside the toggle. */
  prompt: string
  /** An honest caveat, shown when the concern is switched on. */
  caveat?: string
  groups: readonly FlagGroup[]
}

export const CONCERN_GROUP_LABELS: Record<ConcernGroup, string> = {
  health: 'Health',
  faith: 'Faith',
  allergy: 'Allergies',
  intolerance: 'Intolerances',
  diet: 'Diet',
}

// ── Shared id lists, so the same set can't drift between concerns ───────────

const POULTRY = ['chicken-breast', 'chicken-thigh', 'chicken-drumstick', 'chicken-wings', 'ground-turkey', 'turkey-bacon'] as const
const PORK = ['pork-belly', 'pork-shoulder', 'pork-loin', 'ground-pork', 'bacon', 'longganisa', 'tocino', 'luncheon-meat', 'hotdog', 'lard'] as const
const BEEF = ['ground-beef-regular', 'ground-beef-lean', 'beef-sirloin', 'beef-chuck', 'beef-shank', 'beef-tapa', 'oxtail'] as const
const FINFISH = ['tilapia', 'bangus', 'salmon', 'tuna-water', 'tuna-oil', 'tuyo', 'fish-sauce'] as const
const SHELLFISH = ['shrimp', 'bagoong', 'oyster-sauce'] as const
/** Anchovy is in both Caesar dressings, which surprises people. */
const HIDDEN_FISH = ['caesar-dressing', 'caesar-dressing-light'] as const
const MEAT_EXTRACTS = ['bouillon-cube', 'gravy-mix', 'sauce-american-meat'] as const
/** Real dairy. Deliberately excludes the coconut and soy "milks". */
const TRUE_DAIRY = [
  'milk-whole', 'milk-skim', 'evap-milk', 'condensed-milk', 'cheddar', 'quickmelt',
  'kesong-puti', 'parmesan', 'mozzarella', 'cheese-slice', 'feta', 'labneh',
  'yogurt-greek', 'yogurt-flavoured', 'butter', 'cream-heavy', 'sour-cream', 'cream-cheese',
] as const
const DAIRY_CONTAINING = ['yogurt-sauce', 'ranch-dressing', ...HIDDEN_FISH] as const
const WHEAT = [
  'spaghetti-dry', 'spaghetti-wholewheat', 'macaroni', 'pandesal', 'bread-white',
  'bread-wholewheat', 'burger-bun', 'burger-bun-wholewheat', 'pita', 'pita-wholewheat',
  'tortilla-flour', 'tortilla-wholewheat', 'pancake-mix', 'noodles-canton', 'noodles-egg',
  'wonton-wrapper', 'dumpling-wrapper', 'lumpia-wrapper', 'bulgur', 'couscous',
  'breadcrumbs', 'croutons', 'flour',
] as const

export const CONCERNS: readonly Concern[] = [
  {
    id: 'gout',
    label: 'Gout',
    group: 'health',
    prompt: 'Flags the foods actually linked to gout attacks',
    caveat:
      'Food that increases gout risk, not necessarily high purine content.',
    groups: [
      {
        level: 'avoid',
        why: 'concentrated fish, shellfish or meat extract — the highest-risk group',
        ids: ['tuyo', 'bagoong', 'fish-sauce', 'oyster-sauce', 'shrimp', 'oxtail', 'tuna-water', 'tuna-oil', 'bangus', 'bouillon-cube', 'gravy-mix'],
      },
      {
        level: 'caution',
        why: 'meat and fish raise urate — fine occasionally, not daily',
        ids: [...POULTRY, ...PORK.filter((id) => id !== 'lard'), ...BEEF.filter((id) => id !== 'oxtail'), 'tilapia', 'salmon', 'sauce-american-meat'],
      },
      {
        level: 'caution',
        why: 'fructose raises urate even though it contains no purines',
        ids: ['cola', 'iced-tea', 'orange-juice', 'coffee-3in1', 'honey', 'maple-syrup', 'pancake-syrup'],
      },
    ],
  },

  {
    id: 'halal',
    label: 'Halal',
    group: 'faith',
    prompt: 'Flags pork and alcohol',
    caveat:
      'Food that contains pork and alcohol. Does not guarantee actual certification.',
    groups: [{ level: 'avoid', why: 'pork', ids: PORK }],
  },

  // ── Allergies ────────────────────────────────────────────────────────────
  {
    id: 'peanut',
    label: 'Peanuts',
    group: 'allergy',
    prompt: 'Peanut allergy',
    groups: [{ level: 'avoid', why: 'contains peanuts', ids: ['peanuts', 'peanut-butter', 'kare-kare-mix'] }],
  },
  {
    id: 'treenut',
    label: 'Tree nuts',
    group: 'allergy',
    prompt: 'Tree nut allergy',
    caveat:
      'Coconut is included because it is classified as a tree nut in some countries, though most people with a tree nut allergy tolerate it. Check with your doctor.',
    groups: [
      { level: 'avoid', why: 'tree nut', ids: ['cashews', 'almonds'] },
      { level: 'caution', why: 'coconut — classed as a tree nut in some countries', ids: ['coconut-milk', 'coconut-milk-lite', 'oil-coconut', 'coconut-shredded'] },
    ],
  },
  {
    id: 'shellfish',
    label: 'Shellfish',
    group: 'allergy',
    prompt: 'Shellfish allergy',
    groups: [{ level: 'avoid', why: 'shellfish', ids: SHELLFISH }],
  },
  {
    id: 'fish',
    label: 'Fish',
    group: 'allergy',
    prompt: 'Fish allergy',
    groups: [
      { level: 'avoid', why: 'fish', ids: FINFISH },
      { level: 'avoid', why: 'contains anchovy', ids: HIDDEN_FISH },
    ],
  },
  {
    id: 'dairy',
    label: 'Milk (allergy)',
    group: 'allergy',
    prompt: 'Allergic to milk protein — flags all dairy',
    groups: [
      { level: 'avoid', why: 'dairy', ids: TRUE_DAIRY },
      { level: 'avoid', why: 'contains milk', ids: DAIRY_CONTAINING },
    ],
  },
  {
    id: 'egg',
    label: 'Egg',
    group: 'allergy',
    prompt: 'Egg allergy',
    groups: [
      { level: 'avoid', why: 'egg', ids: ['egg', 'egg-white', 'noodles-egg'] },
      { level: 'avoid', why: 'made with egg', ids: ['mayonnaise', 'mayo-light', ...HIDDEN_FISH] },
      { level: 'caution', why: 'wrappers often contain egg', ids: ['wonton-wrapper', 'dumpling-wrapper', 'lumpia-wrapper'] },
    ],
  },
  {
    id: 'soy',
    label: 'Soy',
    group: 'allergy',
    prompt: 'Soy allergy',
    caveat:
      'Excluding soybean oil.',
    groups: [
      { level: 'avoid', why: 'soy', ids: ['soy-sauce', 'soy-milk', 'tofu-firm', 'tofu-fried'] },
      { level: 'avoid', why: 'soy-based sauce', ids: ['hoisin', 'black-bean-sauce', 'doubanjiang', 'oyster-sauce'] },
    ],
  },
  {
    id: 'gluten',
    label: 'Gluten',
    group: 'allergy',
    prompt: 'Coeliac disease or gluten sensitivity',
    groups: [
      { level: 'avoid', why: 'wheat', ids: WHEAT },
      { level: 'avoid', why: 'contains wheat', ids: ['soy-sauce', 'hoisin', 'doubanjiang', 'gravy-mix', 'cornflakes'] },
      { level: 'caution', why: 'oats are usually milled alongside wheat', ids: ['oats-rolled', 'oats-instant-sweet'] },
    ],
  },
  {
    id: 'sesame',
    label: 'Sesame',
    group: 'allergy',
    prompt: 'Sesame allergy',
    groups: [
      { level: 'avoid', why: 'sesame', ids: ['oil-sesame', 'sesame-seeds', 'tahini'] },
      { level: 'avoid', why: 'made with tahini', ids: ['hummus'] },
      { level: 'avoid', why: 'sesame in the blend', ids: ['zaatar'] },
    ],
  },

  // ── Intolerances ─────────────────────────────────────────────────────────
  {
    id: 'lactose',
    label: 'Lactose',
    group: 'intolerance',
    prompt: 'Lactose intolerant',
    caveat:
      'Not the same as a milk allergy. Butter, parmesan and aged cheddar are very low in lactose, and strained yogurt is usually fine.',
    groups: [
      {
        level: 'avoid',
        why: 'high in lactose',
        ids: ['milk-whole', 'milk-skim', 'evap-milk', 'condensed-milk', 'cream-heavy', 'sour-cream', 'cream-cheese'],
      },
      {
        level: 'caution',
        why: 'fresh cheese — some lactose remains',
        ids: ['quickmelt', 'cheese-slice', 'mozzarella', 'kesong-puti', 'labneh', 'yogurt-flavoured', 'yogurt-sauce', 'ranch-dressing'],
      },
    ],
  },
  {
    id: 'fructose',
    label: 'Fructose',
    group: 'intolerance',
    prompt: 'Fructose malabsorption',
    groups: [
      { level: 'avoid', why: 'concentrated fructose', ids: ['honey', 'maple-syrup', 'pancake-syrup', 'orange-juice', 'cola', 'iced-tea'] },
      { level: 'caution', why: 'high-fructose fruit', ids: ['apple', 'pineapple-chunks', 'raisins'] },
      { level: 'caution', why: 'sweetened with syrup or sugar', ids: ['sweet-sour-sauce', 'bbq-sauce', 'ketchup', 'banana-ketchup', 'hoisin'] },
    ],
  },
  {
    id: 'caffeine',
    label: 'Caffeine',
    group: 'intolerance',
    prompt: 'Avoiding caffeine',
    groups: [
      { level: 'avoid', why: 'caffeinated', ids: ['coffee-black', 'coffee-3in1', 'cola', 'cola-diet', 'iced-tea'] },
      { level: 'caution', why: 'cacao contains some caffeine', ids: ['tablea', 'cocoa-powder'] },
    ],
  },
  {
    id: 'fodmap',
    label: 'FODMAPs (IBS)',
    group: 'intolerance',
    prompt: 'Following a low-FODMAP diet',
    caveat:
      'FODMAP stands for fermentable oligosaccharides, disaccharides, monosaccharides, and polyols. These are short-chain carbohydrates and sugar alcohols that the small intestine poorly absorbs. When they pass into the large intestine, gut bacteria ferment them, which can cause gas, bloating, and stomach pain.',
    groups: [
      { level: 'avoid', why: 'high-FODMAP allium', ids: ['onion', 'garlic', 'scallion'] },
      { level: 'avoid', why: 'legume — high in galacto-oligosaccharides', ids: ['monggo', 'lentils', 'chickpeas', 'chickpeas-dried', 'kidney-beans', 'hummus', 'falafel', 'soy-milk'] },
      { level: 'avoid', why: 'wheat — high in fructans', ids: [...WHEAT] },
      { level: 'avoid', why: 'lactose', ids: ['milk-whole', 'milk-skim', 'evap-milk', 'condensed-milk'] },
      { level: 'caution', why: 'high-FODMAP produce', ids: ['apple', 'mushroom', 'cauliflower', 'snow-peas', 'avocado', 'honey'] },
    ],
  },

  // ── Diet ─────────────────────────────────────────────────────────────────
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    group: 'diet',
    prompt: 'No meat or fish',
    groups: [
      { level: 'avoid', why: 'meat', ids: [...POULTRY, ...PORK, ...BEEF] },
      { level: 'avoid', why: 'fish or shellfish', ids: [...FINFISH, ...SHELLFISH] },
      { level: 'avoid', why: 'made with meat or fish', ids: [...MEAT_EXTRACTS, ...HIDDEN_FISH] },
    ],
  },
  {
    id: 'vegan',
    label: 'Vegan',
    group: 'diet',
    prompt: 'No animal products at all',
    groups: [
      { level: 'avoid', why: 'meat', ids: [...POULTRY, ...PORK, ...BEEF] },
      { level: 'avoid', why: 'fish or shellfish', ids: [...FINFISH, ...SHELLFISH] },
      { level: 'avoid', why: 'made with meat or fish', ids: [...MEAT_EXTRACTS, ...HIDDEN_FISH] },
      { level: 'avoid', why: 'dairy', ids: TRUE_DAIRY },
      { level: 'avoid', why: 'egg', ids: ['egg', 'egg-white', 'noodles-egg', 'mayonnaise', 'mayo-light'] },
      { level: 'avoid', why: 'from animals', ids: ['honey', 'yogurt-sauce', 'ranch-dressing'] },
    ],
  },
] as const

export const CONCERNS_BY_ID: Record<string, Concern> = Object.fromEntries(
  CONCERNS.map((c) => [c.id, c]),
)

/** One reason a product tripped one concern. */
export interface Flagged {
  concern: ConcernId
  label: string
  level: FlagLevel
  why: string
}

/**
 * Every flag a product picks up from the concerns currently switched on, worst
 * first so a card showing only the first one shows the most serious.
 */
export function flagsFor(
  productId: string,
  active: readonly ConcernId[] | undefined,
): Flagged[] {
  if (!active || active.length === 0) return []

  const found: Flagged[] = []
  for (const id of active) {
    const concern = CONCERNS_BY_ID[id]
    if (!concern) continue
    for (const group of concern.groups) {
      if (!group.ids.includes(productId)) continue
      found.push({ concern: concern.id, label: concern.label, level: group.level, why: group.why })
      break // one flag per concern; the first group that matches is the worst
    }
  }

  return found.sort((a, b) => (a.level === b.level ? 0 : a.level === 'avoid' ? -1 : 1))
}

/** True when any concern rates this product 'avoid'. */
export function shouldAvoid(productId: string, active: readonly ConcernId[] | undefined): boolean {
  return flagsFor(productId, active).some((f) => f.level === 'avoid')
}

/** Every product id named anywhere in the concern data — used by the tests. */
export function allFlaggedIds(): string[] {
  const ids = new Set<string>()
  for (const concern of CONCERNS) {
    for (const group of concern.groups) {
      for (const id of group.ids) ids.add(id)
    }
  }
  return [...ids]
}

/** Ids referenced by a single concern, at any level. */
export function idsForConcern(id: ConcernId): string[] {
  const concern = CONCERNS_BY_ID[id]
  if (!concern) return []
  return [...new Set(concern.groups.flatMap((g) => [...g.ids]))]
}

/** Catalogue lookup, re-exported so tests and UI share one source. */
export function productExists(id: string): boolean {
  return CATALOG[id] !== undefined
}
