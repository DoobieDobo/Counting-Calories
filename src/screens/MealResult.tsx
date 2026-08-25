import { MacroBar } from '../components/MacroBar'
import { seatColor } from '../components/PlayerChips'
import { MEAL_LABELS } from '../engine/calories'
import { RUN_MEALS, mealShares } from '../state/gameReducer'
import { useGame } from '../state/GameContext'

export function MealResult() {
  const { state, dispatch } = useGame()
  const meal = state.history[state.history.length - 1]
  if (!meal) return null

  const { verdict } = meal
  const isLastMeal = state.mealIndex >= RUN_MEALS.length - 1
  const shares = mealShares(state.players, meal.slot, meal.totals.kcal)

  return (
    <div className="screen">
      <div className="screen-head">
        <p className="eyebrow">{MEAL_LABELS[meal.slot]} · done</p>
        <h1>
          {meal.dishEmoji} {meal.dishName}
        </h1>
      </div>

      <div className={`verdict card verdict-${verdict.grade.toLowerCase()}`}>
        <div className="verdict-grade" aria-hidden="true">
          {verdict.grade}
        </div>
        <div className="verdict-figures">
          <div>
            <span className="eyebrow">Spent</span>
            <strong className="num verdict-big">{meal.totals.kcal.toLocaleString()}</strong>
          </div>
          <div>
            <span className="eyebrow">Budget</span>
            <strong className="num verdict-big">{meal.budget.toLocaleString()}</strong>
          </div>
          <div>
            <span className="eyebrow">Left</span>
            <strong className="num verdict-big">{verdict.remaining.toLocaleString()}</strong>
          </div>
        </div>
        <span className="visually-hidden">Grade {verdict.grade}</span>
      </div>

      {verdict.notes.length > 0 && (
        <ul className="coaching">
          {verdict.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}

      <div className="card cart-macros">
        <h3>The plate</h3>
        <MacroBar split={verdict.split} />
        <ul className="macro-grams">
          <li>
            Protein <strong className="num">{Math.round(meal.totals.protein)} g</strong>
          </li>
          <li>
            Carbs <strong className="num">{Math.round(meal.totals.carbs)} g</strong>
          </li>
          <li>
            Fat <strong className="num">{Math.round(meal.totals.fat)} g</strong>
          </li>
        </ul>
      </div>

      {shares.length > 1 && (
        <div className="card split-card">
          <h3>Who ate what</h3>
          <ul className="split-list">
            {shares.map(({ player, kcal, budget }, i) => {
              const over = kcal > budget
              return (
                <li key={player.id} style={{ '--seat': seatColor(i) } as React.CSSProperties}>
                  <span className="player-chip-dot" aria-hidden="true" />
                  <span className="split-name">{player.profile.name}</span>
                  <span className="split-bar" aria-hidden="true">
                    <span
                      className={over ? 'over' : ''}
                      style={{ width: `${Math.min(100, (kcal / Math.max(1, budget)) * 100)}%` }}
                    />
                  </span>
                  <strong className="num">{kcal.toLocaleString()}</strong>
                  <span className="split-of num">of {budget.toLocaleString()}</span>
                </li>
              )
            })}
          </ul>
          <p className="lede">
            You cooked {meal.servings} servings for{' '}
            <strong className="num">{meal.totals.kcal.toLocaleString()}</strong> calories, split
            in proportion to what each of you actually needs — so everyone's plate is measured
            against their own budget, not an average nobody is on.
          </p>
        </div>
      )}

      {verdict.remaining > 0 && !isLastMeal && (
        <p className="lede">
          <strong className="num">{verdict.remaining.toLocaleString()}</strong> calories carry over
          to {MEAL_LABELS[RUN_MEALS[state.mealIndex + 1] ?? 'dinner'].toLowerCase()}.
        </p>
      )}

      <div className="btn-row">
        <button type="button" className="btn" onClick={() => dispatch({ type: 'NEXT_MEAL' })}>
          {isLastMeal
            ? 'See how the day went'
            : `On to ${MEAL_LABELS[RUN_MEALS[state.mealIndex + 1] ?? 'dinner'].toLowerCase()} →`}
        </button>
      </div>
    </div>
  )
}
