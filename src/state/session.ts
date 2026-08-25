/**
 * When the player was last here, and whether that counts as a break.
 *
 * On its own storage key, like the round archive and for the same reason: the
 * run's key has been bumped three times and every bump discards what it holds.
 * A stamp that survives a version change is both harmless and more useful — and
 * keeping it out of the run means adding it costs nobody the round they are
 * halfway through.
 */

const KEY = 'counting-calories:last-played:v1'

/** A different day, but not merely the far side of midnight. */
const MIN_GAP_MS = 4 * 60 * 60 * 1000

/**
 * Read once, at import.
 *
 * `GameProvider` stamps this from an effect on every state change, so anything
 * reading it lazily would be racing that write. Effects happen to run after the
 * first render, which makes a lazy read safe today; caching here means the
 * greeting does not depend on that staying true.
 */
function readStamp(): number | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const value = Number(raw)
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    // Private browsing, storage switched off. No stamp means no greeting,
    // which is the right way to fail: it never interrupts anyone.
    return null
  }
}

const openedWith: number | null = readStamp()

/** When the player last touched the game, as of this page load. */
export function lastPlayedAt(): number | null {
  return openedWith
}

export function touchLastPlayed(now = Date.now()): void {
  try {
    localStorage.setItem(KEY, String(now))
  } catch {
    // See above.
  }
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * Has it been long enough to greet someone rather than drop them back in?
 *
 * "A day" as a person means it — played last night, welcomed back this morning
 * — rather than twenty-four hours to the minute. The four-hour floor stops the
 * silly case where playing at 23:50 and returning at 00:10 reads as a new day.
 *
 * A first-ever visit is never a break: there is nothing to come back to.
 */
export function hasBeenAWhile(now = Date.now(), since = openedWith): boolean {
  if (since === null) return false
  const gap = now - since
  if (gap < MIN_GAP_MS) return false
  return !isSameDay(new Date(since), new Date(now))
}
