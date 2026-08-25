/**
 * Light, dark, or whatever the phone says.
 *
 * The palette in `theme.css` is written once with `light-dark()`, so switching
 * is a matter of pinning `color-scheme` — which the `:root[data-theme]` rules
 * there already do. Nothing here touches a colour; it only decides which of the
 * three states is in force.
 */

export type ThemePreference = 'system' | 'dark' | 'light'

/** Shared with the inline script in index.html — change both together. */
const KEY = 'counting-calories:theme:v1'

/** Matches `--bg` in each scheme, so the phone's browser bar matches the page. */
const BAR_COLOUR = { light: '#fdf8f0', dark: '#16130f' } as const

/** What the sidebar shows. "Night mode: On" reads better than "Dark". */
export const THEME_LABEL: Record<ThemePreference, string> = {
  system: 'Auto',
  dark: 'On',
  light: 'Off',
}

export function loadTheme(): ThemePreference {
  try {
    const raw = localStorage.getItem(KEY)
    return raw === 'dark' || raw === 'light' ? raw : 'system'
  } catch {
    // Storage off. Following the OS is the right thing to fall back to.
    return 'system'
  }
}

/** Auto → On → Off → Auto, so one tap from the default turns night mode on. */
export function nextTheme(current: ThemePreference): ThemePreference {
  return current === 'system' ? 'dark' : current === 'dark' ? 'light' : 'system'
}

/** True when `system` currently resolves to dark. */
function osPrefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

export function applyTheme(preference: ThemePreference): void {
  const root = document.documentElement

  // No attribute is the third state: `color-scheme: light dark` then lets
  // prefers-color-scheme decide, which is what an unset preference means.
  if (preference === 'system') delete root.dataset.theme
  else root.dataset.theme = preference

  const dark = preference === 'dark' || (preference === 'system' && osPrefersDark())
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? BAR_COLOUR.dark : BAR_COLOUR.light)
}

export function setTheme(preference: ThemePreference): void {
  try {
    if (preference === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, preference)
  } catch {
    // The choice still applies to this page; it just will not be remembered.
  }
  applyTheme(preference)
}
