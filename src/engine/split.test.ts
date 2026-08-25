import { describe, expect, it } from 'vitest'
import { largestRemainder, splitAmount } from './split'

describe('largestRemainder', () => {
  it('splits evenly when it divides cleanly', () => {
    expect(largestRemainder(300, [1, 1, 1])).toEqual([100, 100, 100])
  })

  it('always sums back to the total', () => {
    // The whole point. Rounding each share on its own loses or invents units,
    // which on a receipt reads as a bug.
    for (const total of [1, 7, 99, 100, 1001, 2437]) {
      for (const weights of [[1, 1], [1, 2], [3, 3, 3], [2600, 1300], [1, 1, 1, 1, 1, 1], [5, 1, 1]]) {
        const shares = largestRemainder(total, weights)
        expect(shares.reduce((a, b) => a + b, 0), `${total} over ${weights.join('/')}`).toBe(total)
      }
    }
  })

  it('gives the bigger weight the bigger share', () => {
    const [big, small] = largestRemainder(1000, [2600, 1300])
    expect(big).toBeGreaterThan(small!)
    expect(big).toBe(667)
    expect(small).toBe(333)
  })

  it('hands the leftover to whoever was rounded down hardest', () => {
    // 10 over [1,1,1] is 3.33 each; the extra unit goes to the first of the
    // equally-shortchanged rather than being dropped.
    expect(largestRemainder(10, [1, 1, 1])).toEqual([4, 3, 3])
  })

  it('splits evenly rather than dividing by zero when nothing has weight', () => {
    expect(largestRemainder(9, [0, 0, 0])).toEqual([3, 3, 3])
    expect(largestRemainder(10, [0, 0, 0]).reduce((a, b) => a + b, 0)).toBe(10)
  })

  it('handles the trivial shapes', () => {
    expect(largestRemainder(100, [])).toEqual([])
    expect(largestRemainder(0, [1, 2])).toEqual([0, 0])
    expect(largestRemainder(100, [5])).toEqual([100])
  })

  it('still sums correctly for a negative total', () => {
    expect(largestRemainder(-10, [1, 1, 1]).reduce((a, b) => a + b, 0)).toBe(-10)
  })
})

describe('splitAmount', () => {
  it('keeps one decimal place and still adds up', () => {
    const shares = splitAmount(12.5, [2600, 1300])
    expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(12.5, 5)
  })

  it('does not leak floating-point noise into a quantity someone reads', () => {
    for (const amount of [0.1, 0.3, 12.3, 99.9, 240, 2760]) {
      for (const share of splitAmount(amount, [3, 2, 1])) {
        expect(Number.isInteger(share * 10), `${amount} -> ${share}`).toBe(true)
      }
    }
  })

  it('sums to the amount across a table of six', () => {
    const weights = [2600, 2400, 2100, 1800, 1500, 1300]
    for (const amount of [1, 6.5, 240, 517.3, 2760]) {
      const shares = splitAmount(amount, weights)
      expect(shares.reduce((a, b) => a + b, 0), `${amount}`).toBeCloseTo(amount, 5)
    }
  })
})
