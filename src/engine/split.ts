/**
 * Dividing a whole into shares that add back up to it.
 *
 * Used twice: to split a cooked meal's calories across the table, and to split
 * a shopping line's grams the same way. Both are read as receipts, and a
 * receipt whose parts don't sum to its total reads as a bug even when the
 * arithmetic behind it is fine.
 */

/**
 * Largest-remainder apportionment.
 *
 * Every share is floored, then the units lost to flooring are handed out one at
 * a time to whoever was rounded down hardest. The result sums to exactly
 * `total`, which naive rounding does not.
 *
 * `total` and the result are whole units — scale before and after for decimals.
 */
export function largestRemainder(total: number, weights: readonly number[]): number[] {
  if (weights.length === 0) return []

  const sum = weights.reduce((a, b) => a + b, 0)
  // No weight to go on — an equal split is the only defensible answer, and
  // still has to add up, so it goes through the same apportionment.
  const effective = sum > 0 ? weights : weights.map(() => 1)
  const effectiveSum = sum > 0 ? sum : weights.length

  const exact = effective.map((w) => (total * w) / effectiveSum)
  const shares = exact.map((n) => Math.floor(n))
  let leftover = total - shares.reduce((a, b) => a + b, 0)

  const byRemainder = exact
    .map((n, i) => ({ i, fraction: n - Math.floor(n) }))
    .sort((a, b) => b.fraction - a.fraction)

  // A negative total (never used today, but cheap to be right about) hands the
  // leftover back in the same order rather than looping forever.
  const step = leftover < 0 ? -1 : 1
  for (const { i } of byRemainder) {
    if (leftover === 0) break
    shares[i]! += step
    leftover -= step
  }

  return shares
}

/**
 * The same split for a quantity carried to one decimal place, which is how the
 * shopping list measures things. Works in tenths so the parts still sum exactly.
 */
export function splitAmount(amount: number, weights: readonly number[]): number[] {
  return largestRemainder(Math.round(amount * 10), weights).map((tenths) => tenths / 10)
}
