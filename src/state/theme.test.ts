import { beforeEach, describe, expect, it, vi } from 'vitest'
import { THEME_LABEL, applyTheme, loadTheme, nextTheme, setTheme } from './theme'

const KEY = 'counting-calories:theme:v1'

let store: Map<string, string>
let root: { dataset: Record<string, string | undefined> }
let meta: { content: string; setAttribute: (name: string, value: string) => void }

beforeEach(() => {
  store = new Map()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })

  // `delete root.dataset.theme` has to actually remove the key, so a plain
  // object stands in for the real DOMStringMap.
  root = { dataset: {} }
  meta = {
    content: '',
    setAttribute(name: string, value: string) {
      if (name === 'content') this.content = value
    },
  }
  vi.stubGlobal('document', {
    documentElement: root,
    querySelector: (sel: string) => (sel.includes('theme-color') ? meta : null),
  })
  vi.stubGlobal('window', {
    matchMedia: () => ({ matches: false }),
  })
})

describe('the preference', () => {
  it('follows the OS until something is chosen', () => {
    expect(loadTheme()).toBe('system')
  })

  it('remembers a choice', () => {
    setTheme('dark')
    expect(loadTheme()).toBe('dark')
  })

  it('stores nothing for "follow the OS"', () => {
    // An absent key and "system" mean the same thing; writing the word would
    // make a later default change unable to reach anyone who ever tapped.
    setTheme('dark')
    setTheme('system')
    expect(store.has(KEY)).toBe(false)
    expect(loadTheme()).toBe('system')
  })

  it('reads junk as following the OS', () => {
    for (const junk of ['', 'nightmode', 'DARK', 'true']) {
      store.set(KEY, junk)
      expect(loadTheme(), junk).toBe('system')
    }
  })

  it('survives storage that throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {
        throw new Error('SecurityError')
      },
      removeItem: () => {},
    })
    expect(loadTheme()).toBe('system')
    expect(() => setTheme('dark')).not.toThrow()
    // The choice still applies to the page it was made on.
    expect(root.dataset.theme).toBe('dark')
  })
})

describe('cycling', () => {
  it('turns night mode on with one tap from the default', () => {
    expect(nextTheme('system')).toBe('dark')
  })

  it('returns to where it started', () => {
    let t = nextTheme('system')
    t = nextTheme(t)
    expect(nextTheme(t)).toBe('system')
  })

  it('labels each state as a setting rather than a colour', () => {
    expect(THEME_LABEL.system).toBe('Auto')
    expect(THEME_LABEL.dark).toBe('On')
    expect(THEME_LABEL.light).toBe('Off')
  })
})

describe('applying it', () => {
  it('pins the scheme for an explicit choice', () => {
    applyTheme('dark')
    expect(root.dataset.theme).toBe('dark')
    applyTheme('light')
    expect(root.dataset.theme).toBe('light')
  })

  it('removes the attribute for "follow the OS"', () => {
    // No attribute is the third state: `color-scheme: light dark` then lets
    // prefers-color-scheme decide. An attribute of "system" would match neither
    // rule and silently strand the page on light.
    applyTheme('dark')
    applyTheme('system')
    expect('theme' in root.dataset).toBe(false)
  })

  it('matches the browser bar to the page', () => {
    applyTheme('dark')
    expect(meta.content).toBe('#16130f')
    applyTheme('light')
    expect(meta.content).toBe('#fdf8f0')
  })

  it('follows the OS for the browser bar when nothing is chosen', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) })
    applyTheme('system')
    expect(meta.content).toBe('#16130f')
  })
})
