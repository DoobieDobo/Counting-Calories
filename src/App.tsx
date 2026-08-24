import { useEffect } from 'react'
import { BudgetReveal } from './screens/BudgetReveal'
import { Cart } from './screens/Cart'
import { DayResult } from './screens/DayResult'
import { DishSelect } from './screens/DishSelect'
import { MealResult } from './screens/MealResult'
import { MenuSelect } from './screens/MenuSelect'
import { ModeSelect } from './screens/ModeSelect'
import { ProfileForm } from './screens/ProfileForm'
import { Roster } from './screens/Roster'
import { Store } from './screens/Store'
import { Welcome } from './screens/Welcome'
import { useGame } from './state/GameContext'

export function App() {
  const { state } = useGame()

  // Every screen starts at the top. The app swaps whole screens without a
  // router, so nothing resets the scroll position on its own.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [state.phase])

  switch (state.phase) {
    case 'welcome':
      return <Welcome />
    case 'mode':
      return <ModeSelect />
    case 'profile':
      return <ProfileForm />
    case 'roster':
      return <Roster />
    case 'budget':
      return <BudgetReveal />
    case 'menu':
      return <MenuSelect />
    case 'dish':
      return <DishSelect />
    case 'store':
      return <Store />
    case 'cart':
      return <Cart />
    case 'meal-result':
      return <MealResult />
    case 'day-result':
      return <DayResult />
    default:
      return <Welcome />
  }
}
