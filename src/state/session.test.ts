/**
 * The greeting has to be right in both directions: interrupting someone
 * mid-session is worse than never greeting them at all, and a returning player
 * who lands straight in the shop is the problem this exists to fix.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hasBeenAWhile, lastPlayedAt, touchLastPlayed } from './session'

/** Local-time helper, since the rule is about calendar days as lived. */
const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 2, day, hour, minute).getTime()

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
})

describe('what counts as a break', () => {
  it('is not a break within the same day, however long the gap', () => {
    expect(hasBeenAWhile(at(10, 23), at(10, 7))).toBe(false)
  })

  it('is not a break just because midnight passed', () => {
    // Playing at 23:50 and coming back at 00:10 is one sitting, not two days.
    expect(hasBeenAWhile(at(11, 0, 10), at(10, 23, 50))).toBe(false)
  })

  it('is a break the next morning', () => {
    expect(hasBeenAWhile(at(11, 8), at(10, 21))).toBe(true)
  })

  it('is a break after several days', () => {
    expect(hasBeenAWhile(at(20, 12), at(10, 12))).toBe(true)
  })

  it('is never a break on a first ever visit', () => {
    // Nothing to come back to, so nothing to be welcomed back from.
    expect(hasBeenAWhile(at(10, 12), null)).toBe(false)
  })

  it('shrugs at a stamp from the future rather than greeting', () => {
    // A clock change should not fire the greeting on someone mid-session.
    expect(hasBeenAWhile(at(10, 12), at(11, 12))).toBe(false)
  })
})

describe('the stamp', () => {
  it('is absent before anything is written', () => {
    expect(lastPlayedAt()).toBeNull()
  })

  it('writes without throwing', () => {
    expect(() => touchLastPlayed(at(10, 9))).not.toThrow()
    expect(localStorage.getItem('counting-calories:last-played:v1')).toBe(String(at(10, 9)))
  })

  it('survives storage that throws on write', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
      removeItem: () => {},
    })
    expect(() => touchLastPlayed()).not.toThrow()
  })
})

describe('reading the stamp at load', () => {
  /** Re-imports the module so the import-time read runs against a fresh store. */
  async function reload(stored: string | null) {
    const store = new Map<string, string>()
    if (stored !== null) store.set('counting-calories:last-played:v1', stored)
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    })
    vi.resetModules()
    return import('./session')
  }

  it('picks up a stamp written by an earlier visit', async () => {
    const mod = await reload(String(at(10, 21)))
    expect(mod.lastPlayedAt()).toBe(at(10, 21))
    expect(mod.hasBeenAWhile(at(11, 8))).toBe(true)
  })

  it('treats junk as no stamp rather than as an ancient one', async () => {
    // Number('') is 0, which would read as 1970 and greet everybody forever.
    for (const junk of ['', 'yesterday', '0', '-5', 'NaN']) {
      const mod = await reload(junk)
      expect(mod.lastPlayedAt(), junk).toBeNull()
      expect(mod.hasBeenAWhile(at(11, 8)), junk).toBe(false)
    }
  })

  it('survives storage that throws on read', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {},
      removeItem: () => {},
    })
    vi.resetModules()
    const mod = await import('./session')
    expect(mod.lastPlayedAt()).toBeNull()
  })
})
