import type { Menu, MenuId } from './types'

export const MENUS: readonly Menu[] = [
  {
    id: 'breakfast',
    name: 'Breakfast',
    emoji: '🌅',
    blurb: 'Silogs and stacks — the Filipino and American ways to start a day.',
  },
  {
    id: 'filipino',
    name: 'Filipino',
    emoji: '🇵🇭',
    blurb: 'Sour, salty, sweet, and almost always with rice.',
  },
  {
    id: 'american',
    name: 'American',
    emoji: '🇺🇸',
    blurb: 'Diner classics, and the portions that come with them.',
  },
  {
    id: 'arabic',
    name: 'Arabic',
    emoji: '🇱🇧',
    blurb: 'Grills, wraps, and a table covered in small dishes.',
  },
  {
    id: 'chinese',
    name: 'Chinese',
    emoji: '🇨🇳',
    blurb: 'Wok-fired, steamed, and stacked in bamboo baskets.',
  },
] as const

/** Which menus each meal slot offers. Breakfast is its own thing. */
export const MENUS_BY_MEAL: Record<'breakfast' | 'lunch' | 'dinner' | 'snack', readonly MenuId[]> = {
  breakfast: ['breakfast'],
  lunch: ['filipino', 'american', 'arabic', 'chinese'],
  dinner: ['filipino', 'american', 'arabic', 'chinese'],
  snack: ['filipino', 'american', 'arabic', 'chinese'],
}

export function getMenu(id: MenuId): Menu | undefined {
  return MENUS.find((m) => m.id === id)
}
