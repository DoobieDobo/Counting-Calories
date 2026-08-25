/**
 * The dietary data is hand-authored judgement about food, and two kinds of
 * mistake in it are dangerous rather than merely wrong:
 *
 *   - a typo'd product id silently disables a flag, so an allergen shows as
 *     clean;
 *   - an omission does the same, and no amount of "every id resolves" checking
 *     will find it.
 *
 * So these tests come at the data from both directions: every id named must
 * exist, *and* every product the catalogue implies is an allergen must be
 * flagged for it.
 */

import { describe, expect, it } from 'vitest'
import { CATALOG, PRODUCTS } from './products'
import {
  CONCERNS,
  CONCERN_GROUP_LABELS,
  allFlaggedIds,
  flagsFor,
  idsForConcern,
  shouldAvoid,
  type ConcernId,
} from './dietary'

describe('concern definitions', () => {
  it('has unique ids', () => {
    const ids = CONCERNS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every concern a label, prompt and a known group', () => {
    for (const c of CONCERNS) {
      expect(c.label.length, c.id).toBeGreaterThan(0)
      expect(c.prompt.length, c.id).toBeGreaterThan(0)
      expect(CONCERN_GROUP_LABELS[c.group], c.id).toBeDefined()
    }
  })

  it('flags at least one product per concern', () => {
    for (const c of CONCERNS) {
      expect(idsForConcern(c.id).length, c.id).toBeGreaterThan(0)
    }
  })

  it('gives every flag group a reason', () => {
    for (const c of CONCERNS) {
      for (const g of c.groups) {
        expect(g.why.length, `${c.id}: "${g.why}"`).toBeGreaterThan(0)
        expect(g.ids.length, `${c.id}: "${g.why}"`).toBeGreaterThan(0)
      }
    }
  })

  it('names only products that exist — a typo would silently clear an allergen', () => {
    for (const id of allFlaggedIds()) {
      expect(CATALOG[id], `unknown product id in dietary data: ${id}`).toBeDefined()
    }
  })
})

describe('gout is risk, not purine content', () => {
  /**
   * The specific mistake this feature invites. Purine-rich plants are not
   * associated with gout attacks, and dairy lowers risk — flagging them would
   * be wrong and would steer players away from the cheapest, most filling
   * things on the shelf.
   */
  const mustStayClean = [
    'spinach', 'monggo', 'lentils', 'chickpeas', 'chickpeas-dried', 'kidney-beans',
    'mushroom', 'cauliflower', 'kangkong', 'snow-peas', 'sitaw', 'broccoli',
    'tofu-firm', 'tofu-fried', 'milk-skim', 'milk-whole', 'yogurt-greek', 'cheddar',
  ]

  it.each(mustStayClean)('does not flag %s for gout', (id) => {
    expect(flagsFor(id, ['gout'])).toEqual([])
  })

  it('flags the concentrated animal sources it should', () => {
    for (const id of ['tuyo', 'bagoong', 'fish-sauce', 'oyster-sauce', 'shrimp', 'oxtail', 'tuna-water', 'bouillon-cube']) {
      expect(shouldAvoid(id, ['gout']), id).toBe(true)
    }
  })

  it('treats everyday meat as caution rather than avoid', () => {
    for (const id of ['chicken-breast', 'ground-beef-lean', 'pork-loin', 'salmon']) {
      const flags = flagsFor(id, ['gout'])
      expect(flags.length, id).toBe(1)
      expect(flags[0]!.level, id).toBe('caution')
    }
  })

  it('flags sugary drinks, which raise urate with no purines at all', () => {
    expect(flagsFor('cola', ['gout'])[0]?.why).toMatch(/fructose/i)
  })

  it('leaves granulated sugar alone, so the signal is not diluted', () => {
    expect(flagsFor('sugar-white', ['gout'])).toEqual([])
    expect(flagsFor('sugar-brown', ['gout'])).toEqual([])
  })
})

describe('allergen coverage, checked from the catalogue side', () => {
  /** Every product matching the pattern must be flagged for the concern. */
  const coverage: [ConcernId, RegExp][] = [
    ['fish', /tuna|tuyo|bangus|tilapia|salmon|fish-sauce/],
    ['shellfish', /^shrimp$|bagoong|oyster/],
    ['peanut', /peanut|kare-kare/],
    ['treenut', /cashew|almond/],
    ['sesame', /sesame|tahini/],
  ]

  it.each(coverage)('flags every %s product the catalogue contains', (concern, pattern) => {
    const missed = PRODUCTS.filter((p) => pattern.test(p.id) && flagsFor(p.id, [concern]).length === 0)
    expect(missed.map((p) => p.id)).toEqual([])
  })

  it('flags every real dairy product for a milk allergy', () => {
    // The `dairy` *category* also holds coconut and soy "milks", which are not
    // dairy — so this walks the category and excludes them deliberately.
    const notActuallyDairy = new Set(['soy-milk', 'coconut-milk', 'coconut-milk-lite', 'margarine'])
    const missed = PRODUCTS.filter(
      (p) => p.category === 'dairy' && !notActuallyDairy.has(p.id) && flagsFor(p.id, ['dairy']).length === 0,
    )
    expect(missed.map((p) => p.id)).toEqual([])
  })

  it('does not flag the plant milks as dairy', () => {
    for (const id of ['soy-milk', 'coconut-milk', 'coconut-milk-lite']) {
      expect(flagsFor(id, ['dairy']), id).toEqual([])
    }
  })

  it('catches the anchovy hiding in Caesar dressing', () => {
    expect(shouldAvoid('caesar-dressing', ['fish'])).toBe(true)
    expect(shouldAvoid('caesar-dressing-light', ['fish'])).toBe(true)
  })

  it('catches the wheat hiding in soy sauce', () => {
    expect(shouldAvoid('soy-sauce', ['gluten'])).toBe(true)
  })

  it('leaves rice and rice noodles unflagged for gluten', () => {
    for (const id of ['rice-white', 'rice-brown', 'noodles-bihon', 'cornstarch']) {
      expect(flagsFor(id, ['gluten']), id).toEqual([])
    }
  })
})

describe('lactose intolerance is not a milk allergy', () => {
  /**
   * The distinction that makes this worth having: butter and hard aged cheese
   * are very low in lactose and strained yogurt is usually tolerated, but all
   * three are off-limits with a milk protein allergy.
   */
  const lowLactose = ['butter', 'parmesan', 'cheddar', 'yogurt-greek']

  it.each(lowLactose)('does not flag %s for lactose', (id) => {
    expect(flagsFor(id, ['lactose'])).toEqual([])
  })

  it.each(lowLactose)('does flag %s for a milk allergy', (id) => {
    expect(shouldAvoid(id, ['dairy']), id).toBe(true)
  })

  it('flags the high-lactose items', () => {
    for (const id of ['milk-whole', 'evap-milk', 'condensed-milk', 'cream-heavy']) {
      expect(shouldAvoid(id, ['lactose']), id).toBe(true)
    }
  })
})

describe('halal', () => {
  it('flags every pork product', () => {
    for (const id of ['pork-belly', 'pork-shoulder', 'pork-loin', 'ground-pork', 'bacon', 'longganisa', 'tocino', 'luncheon-meat', 'lard']) {
      expect(shouldAvoid(id, ['halal']), id).toBe(true)
    }
  })

  it('leaves beef, chicken and turkey bacon alone', () => {
    for (const id of ['beef-sirloin', 'ground-beef-lean', 'chicken-breast', 'turkey-bacon']) {
      expect(flagsFor(id, ['halal']), id).toEqual([])
    }
  })
})

describe('vegetarian and vegan agree with the product tags', () => {
  it('never flags a product tagged vegan as non-vegan', () => {
    const contradictions = PRODUCTS.filter(
      (p) => p.tags.includes('vegan') && flagsFor(p.id, ['vegan']).length > 0,
    )
    expect(contradictions.map((p) => p.id)).toEqual([])
  })

  it('never flags a product tagged vegetarian as non-vegetarian', () => {
    const contradictions = PRODUCTS.filter(
      (p) => p.tags.includes('vegetarian') && flagsFor(p.id, ['vegetarian']).length > 0,
    )
    expect(contradictions.map((p) => p.id)).toEqual([])
  })

  it('flags all meat and fish for vegetarians', () => {
    for (const id of ['chicken-breast', 'pork-belly', 'beef-sirloin', 'shrimp', 'tilapia', 'fish-sauce', 'bouillon-cube']) {
      expect(shouldAvoid(id, ['vegetarian']), id).toBe(true)
    }
  })

  it('adds dairy, egg and honey for vegans only', () => {
    for (const id of ['milk-whole', 'egg', 'honey', 'butter']) {
      expect(flagsFor(id, ['vegetarian']), id).toEqual([])
      expect(shouldAvoid(id, ['vegan']), id).toBe(true)
    }
  })
})

describe('flagsFor', () => {
  it('returns nothing when no concerns are active', () => {
    expect(flagsFor('shrimp', [])).toEqual([])
    expect(flagsFor('shrimp', undefined)).toEqual([])
  })

  it('collects one flag per active concern', () => {
    const flags = flagsFor('shrimp', ['gout', 'shellfish', 'vegetarian'])
    expect(flags.map((f) => f.concern).sort()).toEqual(['gout', 'shellfish', 'vegetarian'])
  })

  it('puts avoid before caution, so a truncated list shows the worst', () => {
    // Pork is 'avoid' for halal and 'caution' for gout.
    const flags = flagsFor('pork-belly', ['gout', 'halal'])
    expect(flags[0]!.level).toBe('avoid')
    expect(flags[0]!.concern).toBe('halal')
  })

  it('ignores an unknown concern id rather than throwing', () => {
    expect(flagsFor('shrimp', ['nonsense' as ConcernId])).toEqual([])
  })

  it('leaves an unflagged product clean under every concern at once', () => {
    const everything = CONCERNS.map((c) => c.id)
    expect(flagsFor('tomato-fresh', everything)).toEqual([])
    expect(flagsFor('rice-white', everything)).toEqual([])
  })
})
