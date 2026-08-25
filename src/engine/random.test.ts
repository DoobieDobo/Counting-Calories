import { describe, expect, it } from 'vitest'
import { makeRng, pick, pickExcluding } from './random'

describe('makeRng', () => {
  it('is deterministic for a given seed', () => {
    const a = makeRng(42)
    const b = makeRng(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('produces different streams for different seeds', () => {
    expect(makeRng(1)()).not.toBe(makeRng(2)())
  })

  it('stays within [0, 1)', () => {
    const rng = makeRng(7)
    for (let i = 0; i < 500; i++) {
      const n = rng()
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(1)
    }
  })
})

describe('pick', () => {
  it('returns an item from the list', () => {
    const items = ['a', 'b', 'c']
    expect(items).toContain(pick(items, makeRng(3)))
  })

  it('returns undefined for an empty list', () => {
    expect(pick([], makeRng(3))).toBeUndefined()
  })

  it('can reach every item given enough rolls', () => {
    const rng = makeRng(11)
    const seen = new Set<string>()
    for (let i = 0; i < 200; i++) seen.add(pick(['a', 'b', 'c'], rng)!)
    expect(seen.size).toBe(3)
  })
})

describe('pickExcluding', () => {
  it('never returns the excluded item when alternatives exist', () => {
    const rng = makeRng(5)
    for (let i = 0; i < 100; i++) {
      expect(pickExcluding(['a', 'b', 'c'], 'a', rng)).not.toBe('a')
    }
  })

  it('falls back to the only item rather than returning undefined', () => {
    expect(pickExcluding(['a'], 'a', makeRng(5))).toBe('a')
  })
})
