import { MEAL_LABELS, GOALS } from '../engine/calories'
import { RUN_MEALS, dayTarget, mealPot } from '../state/gameReducer'
import { useGame } from '../state/GameContext'

/**
 * The reveal: here is your number, here is where it came from, and here is how
 * it splits across the day. Showing the working matters — a budget handed down
 * without explanation is just a rule, and rules are easy to dismiss.
 */
export function BudgetReveal() {
  const { state, dispatch } = useGame()
  const isCoop = state.mode === 'coop'
  const first = state.players[0]
  if (!first) return null

  const total = dayTarget(state.players)
  const floored = state.players.filter((p) => p.target.floored)

  return (
    <div className="screen">
      <div className="screen-head">
        <p className="eyebrow">Step 3 of 3</p>
        <h1>{isCoop ? "The table's budget" : 'Your budget'}</h1>
      </div>

      <div className="budget-hero card">
        <span className="eyebrow">Calories a day</span>
        <strong className="num budget-hero-figure">{total.toLocaleString()}</strong>
        {!isCoop && (
          <p className="lede">
            {first.target.bmr.toLocaleString()} at rest, {first.target.tdee.toLocaleString()} with
            how much you move, then{' '}
            {GOALS.find((g) => g.id === first.profile.goal)?.label.toLowerCase()}.
          </p>
        )}
        {isCoop && (
          <p className="lede">
            {state.players.length} players, pooled. You spend it as one cart.
          </p>
        )}
      </div>

      {!isCoop && (
        <div className="working card">
          <h3>How that was worked out</h3>
          <ul className="working-list">
            <li>
              <span>Resting metabolism</span>
              <strong className="num">{first.target.bmr.toLocaleString()}</strong>
            </li>
            <li>
              <span>Plus daily activity</span>
              <strong className="num">{first.target.tdee.toLocaleString()}</strong>
            </li>
            <li>
              <span>{GOALS.find((g) => g.id === first.profile.goal)?.label}</span>
              <strong className="num">{first.target.target.toLocaleString()}</strong>
            </li>
          </ul>
        </div>
      )}

      {floored.length > 0 && (
        <div className="notice notice-warn" role="note">
          <strong>Held at a floor.</strong>{' '}
          {floored.length === 1 && !isCoop
            ? `The arithmetic came out below ${first.target.floor.toLocaleString()} calories a day, so the budget was raised to meet it.`
            : `${floored.map((p) => p.profile.name).join(' and ')} came out below the floor, so their budgets were raised to meet it.`}{' '}
          This game won't set a target low enough to be a problem.
        </div>
      )}

      <div className="meal-split card">
        <h3>Split across the day</h3>
        <ul className="meal-split-list">
          {RUN_MEALS.map((slot) => (
            <li key={slot}>
              <span className="meal-split-name">{MEAL_LABELS[slot]}</span>
              <span className="meal-split-bar" aria-hidden="true">
                <span
                  style={{
                    width: `${(mealPot(state.players, slot, 0) / total) * 100}%`,
                  }}
                />
              </span>
              <strong className="num">{mealPot(state.players, slot, 0).toLocaleString()}</strong>
            </li>
          ))}
        </ul>
        <p className="lede">
          Anything you don't spend on one meal carries over to the next.
        </p>
      </div>

      <div className="btn-row">
        <button type="button" className="btn" onClick={() => dispatch({ type: 'START_RUN' })}>
          Open the menu
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => dispatch({ type: 'GOTO', phase: isCoop ? 'roster' : 'profile' })}
        >
          ← Change my answers
        </button>
      </div>
    </div>
  )
}
