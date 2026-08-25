import { MacroBar } from '../components/MacroBar'
import { MEAL_LABELS } from '../engine/calories'
import { gradeDay } from '../engine/nutrition'
import { PLAN_DAYS, dayTarget } from '../state/gameReducer'
import { useGame } from '../state/GameContext'
import { clear } from '../state/persistence'

export function DayResult() {
  const { state, dispatch } = useGame()
  const target = dayTarget(state.players)
  const day = gradeDay(state.history, target)

  // The day just played is the one after however many are already banked.
  const dayNumber = state.days.length + 1
  const isLastOfBlock = dayNumber >= PLAN_DAYS

  const priciestMeal = state.history.reduce<(typeof state.history)[number] | null>(
    (max, meal) => (!max || meal.totals.kcal > max.totals.kcal ? meal : max),
    null,
  )

  return (
    <div className="screen">
      <div className="screen-head">
        <p className="eyebrow">
          Day {dayNumber} of {PLAN_DAYS}
        </p>
        <h1>
          {day.kcal.toLocaleString()} of {target.toLocaleString()} calories
        </h1>
      </div>

      <div className={`verdict card verdict-${day.grade.toLowerCase()}`}>
        <div className="verdict-grade" aria-hidden="true">
          {day.grade}
        </div>
        <p className="verdict-note">{day.note}</p>
        <span className="visually-hidden">Grade {day.grade}</span>
      </div>

      <div className="card day-meals">
        <h3>What you ate</h3>
        <ul className="day-meal-list">
          {state.history.map((meal) => (
            <li key={meal.slot}>
              <span className="day-meal-emoji" aria-hidden="true">
                {meal.dishEmoji}
              </span>
              <span className="day-meal-body">
                <strong>{meal.dishName}</strong>
                <span className="lede">{MEAL_LABELS[meal.slot]}</span>
              </span>
              <span className="day-meal-bar" aria-hidden="true">
                <span
                  style={{ width: `${Math.min(100, (meal.totals.kcal / meal.budget) * 100)}%` }}
                  className={meal.verdict.overBudget ? 'over' : ''}
                />
              </span>
              <span className="num day-meal-kcal">{meal.totals.kcal.toLocaleString()}</span>
              <span className={`day-meal-grade grade-${meal.verdict.grade.toLowerCase()}`}>
                {meal.verdict.grade}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card cart-macros">
        <h3>The day's balance</h3>
        <MacroBar split={day.split} />
      </div>

      {priciestMeal && (
        <p className="lede">
          Your biggest meal was {priciestMeal.dishName.toLowerCase()} at{' '}
          <strong className="num">{priciestMeal.totals.kcal.toLocaleString()}</strong> calories —{' '}
          {Math.round((priciestMeal.totals.kcal / Math.max(1, day.kcal)) * 100)}% of the day.
        </p>
      )}

      <p className="lede">
        {isLastOfBlock
          ? `That's ${PLAN_DAYS} days. Next up is the meal plan and the shopping list behind it.`
          : `${PLAN_DAYS - dayNumber} more ${PLAN_DAYS - dayNumber === 1 ? 'day' : 'days'} and you get a meal plan and a shopping list you can take with you.`}
      </p>

      <div className="btn-row">
        <button type="button" className="btn" onClick={() => dispatch({ type: 'FINISH_DAY' })}>
          {isLastOfBlock ? 'See the meal plan' : `Play day ${dayNumber + 1}`}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            clear()
            window.location.reload()
          }}
        >
          Start over from scratch
        </button>
      </div>
    </div>
  )
}
