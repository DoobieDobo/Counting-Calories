import { useEffect, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { BudgetReveal } from './screens/BudgetReveal'
import { Cart } from './screens/Cart'
import { DayResult } from './screens/DayResult'
import { DishSelect } from './screens/DishSelect'
import { MealResult } from './screens/MealResult'
import { MenuSelect } from './screens/MenuSelect'
import { ModeSelect } from './screens/ModeSelect'
import { PlanReport } from './screens/PlanReport'
import { ProfileForm } from './screens/ProfileForm'
import { Roster } from './screens/Roster'
import { SavedRounds } from './screens/SavedRounds'
import { Store } from './screens/Store'
import { Welcome } from './screens/Welcome'
import { WelcomeBack } from './screens/WelcomeBack'
import { useGame } from './state/GameContext'
import { loadRounds } from './state/rounds'
import { hasBeenAWhile } from './state/session'

export function App() {
  const { state } = useGame()

  /**
   * Decided once, from the stamp as it was when the page loaded — never
   * persisted. Dismissing it leaves the phase untouched, so Continue lands on
   * the exact screen the run was left on, and tomorrow's visit is greeted
   * because the clock says so rather than because a flag was stored.
   */
  const [greeting, setGreeting] = useState(() => hasBeenAWhile())

  // Every screen starts at the top. The app swaps whole screens without a
  // router, so nothing resets the scroll position on its own.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [state.phase, greeting])

  // Nothing to be welcomed back from on a first visit that left no trace.
  const somethingToReturnTo = state.phase !== 'welcome' || loadRounds().length > 0

  if (greeting && somethingToReturnTo) {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="app-main">
          <WelcomeBack onContinue={() => setGreeting(false)} />
        </main>
      </div>
    )
  }

  // The landing page is its own full-width thing, and there is nothing to
  // navigate away from yet.
  if (state.phase === 'welcome') return <Welcome />

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">{screenFor(state.phase)}</main>
    </div>
  )
}

function screenFor(phase: ReturnType<typeof useGame>['state']['phase']) {
  switch (phase) {
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
    case 'plan-report':
      return <LiveReport />
    case 'saved':
      return <SavedRounds />
    default:
      return <Welcome />
  }
}

/** The report for the round just finished, as opposed to one off the shelf. */
function LiveReport() {
  const { state } = useGame()
  return <PlanReport days={state.days} players={state.players} />
}
