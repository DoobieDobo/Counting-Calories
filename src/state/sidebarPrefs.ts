/**
 * Whether the desktop rail is pinned open or tucked away.
 *
 * Mobile never reads this — under 900px the rail is already a sheet you open
 * and close with the ☰ toggle, so there is nothing left to collapse.
 */

const KEY = 'counting-calories:sidebar:v1'

export function loadSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(KEY) === 'collapsed'
  } catch {
    return false
  }
}

export function setSidebarCollapsed(collapsed: boolean): void {
  try {
    if (collapsed) localStorage.setItem(KEY, 'collapsed')
    else localStorage.removeItem(KEY)
  } catch {
    // The choice still applies to this page; it just will not be remembered.
  }
}
