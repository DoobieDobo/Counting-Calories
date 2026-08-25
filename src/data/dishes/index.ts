import type { Dish, MenuId } from '../types'
import { AMERICAN_DISHES } from './american'
import { ARABIC_DISHES } from './arabic'
import { BREAKFAST_DISHES } from './breakfast'
import { CHINESE_DISHES } from './chinese'
import { FILIPINO_DISHES } from './filipino'

export const DISHES: Dish[] = [
  ...BREAKFAST_DISHES,
  ...FILIPINO_DISHES,
  ...AMERICAN_DISHES,
  ...ARABIC_DISHES,
  ...CHINESE_DISHES,
]

export const DISHES_BY_ID: Record<string, Dish> = Object.fromEntries(
  DISHES.map((d) => [d.id, d]),
)

export function dishesForMenu(menu: MenuId): Dish[] {
  return DISHES.filter((d) => d.menu === menu)
}

export function getDish(id: string): Dish | undefined {
  return DISHES_BY_ID[id]
}
