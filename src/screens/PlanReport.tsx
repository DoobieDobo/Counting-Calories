import { MacroBar } from '../components/MacroBar'
import { getDish } from '../data/dishes'
import { CATALOG } from '../data/products'
import { buildCart } from '../engine/cart'
import { MEAL_LABELS } from '../engine/calories'
import { macroSplit, produceLines } from '../engine/nutrition'
import { formatAmount, shoppingByAisle, shoppingTotal } from '../engine/shopping'
import { suggestPlan } from '../engine/suggest'
import { PLAN_DAYS, RUN_MEALS, dayTarget, tableConcerns } from '../state/gameReducer'
import type { CompletedDay } from '../state/gameReducer'
import { useGame } from '../state/GameContext'
import { clear } from '../state/persistence'

/**
 * What you get for finishing three days: the plan you built, the shopping list
 * behind it, what the three days say about how you shop, and a suggested next
 * three days assembled from what actually worked.
 */
export function PlanReport() {
  const { state, dispatch } = useGame()
  const days = state.days
  if (days.length === 0) return null

  const aisles = shoppingByAisle(days)
  const listTotal = shoppingTotal(days)
  const concerns = tableConcerns(state.players)
  const plan = suggestPlan(days, state.players, concerns)
  const patterns = findPatterns(days)

  const allMeals = days.flatMap((d) => d.meals)
  // Every meal in a block is cooked for the same table, so the first one speaks
  // for all of them; the roster is the fallback for an oddly-shaped save.
  const servings = allMeals[0]?.servings ?? Math.max(1, state.players.length)
  const totals = allMeals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.totals.kcal,
      protein: acc.protein + m.totals.protein,
      carbs: acc.carbs + m.totals.carbs,
      fat: acc.fat + m.totals.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )
  const target = dayTarget(state.players) * days.length

  return (
    <div className="screen report">
      <div className="screen-head">
        <p className="eyebrow">{days.length} days · meal plan</p>
        <h1>What you cooked, and what to buy</h1>
        <p className="lede">
          {allMeals.length} meals across {days.length} days. Everything below adds up to one
          shopping list — this is the part you can take with you.
        </p>
      </div>

      <div className="btn-row report-actions">
        <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
          🖨️ Print or save as PDF
        </button>
      </div>

      {/* ── The plan ─────────────────────────────────────────────────────── */}
      <section className="card report-section">
        <h2>The plan</h2>
        <div className="plan-grid-wrap">
          <table className="plan-grid">
            <thead>
              <tr>
                <th scope="col">Day</th>
                {RUN_MEALS.map((slot) => (
                  <th key={slot} scope="col">
                    {MEAL_LABELS[slot]}
                  </th>
                ))}
                <th scope="col" className="plan-total">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {days.map((day, i) => (
                <tr key={i}>
                  <th scope="row">Day {i + 1}</th>
                  {RUN_MEALS.map((slot) => {
                    const meal = day.meals.find((m) => m.slot === slot)
                    return (
                      <td key={slot}>
                        {meal ? (
                          <span className="plan-cell">
                            <span aria-hidden="true">{meal.dishEmoji}</span>
                            <span className="plan-dish">{meal.dishName}</span>
                            <span className="num plan-kcal">{meal.totals.kcal.toLocaleString()}</span>
                          </span>
                        ) : (
                          <span className="plan-empty">—</span>
                        )}
                      </td>
                    )
                  })}
                  <td className="plan-total">
                    <strong className="num">{day.verdict.kcal.toLocaleString()}</strong>
                    <span className={`day-meal-grade grade-${day.verdict.grade.toLowerCase()}`}>
                      {day.verdict.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lede">
          <strong className="num">{totals.kcal.toLocaleString()}</strong> calories over{' '}
          {days.length} days, against a target of{' '}
          <strong className="num">{target.toLocaleString()}</strong>.
        </p>
        <MacroBar split={macroSplit(totals)} />
      </section>

      {/* ── The shopping list ────────────────────────────────────────────── */}
      <section className="card report-section">
        <h2>The shopping list</h2>
        <p className="lede">
          Everything those meals needed, added up and sorted by aisle. Quantities are already
          scaled to {servings} {servings === 1 ? 'serving' : 'servings'} a meal.
        </p>

        {aisles.map((aisle) => (
          <div key={aisle.category} className="aisle">
            <h3>
              {aisle.label}
              <span className="num aisle-kcal">{aisle.kcal.toLocaleString()} cal</span>
            </h3>
            <ul className="aisle-list">
              {aisle.lines.map((line) => (
                <li key={`${line.product.id}-${line.unit}`}>
                  <span className="aisle-emoji" aria-hidden="true">
                    {line.product.emoji}
                  </span>
                  <span className="aisle-body">
                    <span className="aisle-name">{line.product.name}</span>
                    <span className="aisle-for">for {line.usedIn.join(', ')}</span>
                  </span>
                  <strong className="num aisle-amount">{formatAmount(line)}</strong>
                  <span className="num aisle-line-kcal">{line.kcal.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <p className="lede">
          <strong className="num">{listTotal.toLocaleString()}</strong> calories on the list —
          the same food as above, seen a different way.
        </p>
      </section>

      {/* ── Patterns ─────────────────────────────────────────────────────── */}
      {patterns.length > 0 && (
        <section className="report-section">
          <h2>What the {days.length} days say</h2>
          <ul className="coaching">
            {patterns.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Suggested next block ─────────────────────────────────────────── */}
      <section className="card report-section">
        <h2>Suggested next {PLAN_DAYS} days</h2>
        <p className="lede">
          Built from what worked: dishes you cooked well, plus things you haven't tried from the
          menus you kept coming back to. Nothing here is over your budget
          {concerns.length > 0 && ', or ruled out by what you said you avoid'}.
        </p>
        <div className="suggest-days">
          {plan.map((day, i) => (
            <div key={i} className="suggest-day">
              <h3>Day {i + 1}</h3>
              <ul className="suggest-list">
                {day.map((s) => (
                  <li key={s.slot}>
                    <span className="suggest-slot">{MEAL_LABELS[s.slot]}</span>
                    <span className="suggest-body">
                      <span className="suggest-dish">
                        <span aria-hidden="true">{s.dish.emoji}</span> {s.dish.name}
                      </span>
                      <span className="suggest-why">{s.why}</span>
                    </span>
                    <span className="num suggest-range">
                      {s.low.toLocaleString()}–{s.high.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="lede">
          The range is what each dish costs built leanly versus built freely — what it actually
          comes to is the part you play.
        </p>
      </section>

      <div className="btn-row report-actions">
        <button type="button" className="btn" onClick={() => dispatch({ type: 'RESTART' })}>
          Cook the next {PLAN_DAYS} days
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

/**
 * Coaching at the level of a block rather than a meal — the things you can only
 * see once there are three days to compare.
 */
function findPatterns(days: readonly CompletedDay[]): string[] {
  const notes: string[] = []
  const meals = days.flatMap((d) => d.meals)
  if (meals.length === 0) return notes

  // A meal slot you consistently overspend on.
  for (const slot of RUN_MEALS) {
    const inSlot = meals.filter((m) => m.slot === slot)
    if (inSlot.length < 2) continue
    const over = inSlot.filter((m) => m.verdict.usage > 0.95).length
    if (over === inSlot.length) {
      notes.push(
        `${MEAL_LABELS[slot]} ran close to the limit every single day. That's the meal to plan first, not last.`,
      )
    }
  }

  // Vegetables, across the whole block. Counted from the carts rather than
  // from each meal's notes, which are capped at three and can drop this one.
  const bare = meals.filter((m) => {
    const dish = getDish(m.dishId)
    if (!dish) return false
    return produceLines(buildCart(dish, m.choices, CATALOG, m.servings)) === 0
  })
  if (bare.length >= Math.ceil(meals.length / 2)) {
    notes.push(
      `${bare.length} of ${meals.length} meals had nothing fresh in them. Vegetables are the cheapest calories on the shelf and you're leaving them there.`,
    )
  }

  // Dishes leaned on.
  const counts = new Map<string, number>()
  for (const m of meals) counts.set(m.dishName, (counts.get(m.dishName) ?? 0) + 1)
  const repeated = [...counts.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1])
  if (repeated.length > 0) {
    const [name, n] = repeated[0]!
    notes.push(`You cooked ${name.toLowerCase()} ${n} times. Reliable, or a rut — your call.`)
  }

  // The trend across days.
  const grades = days.map((d) => d.verdict.grade)
  if (grades.length >= 2 && grades[0] !== grades[grades.length - 1]) {
    const better = 'ABCD'.indexOf(grades[grades.length - 1]!) < 'ABCD'.indexOf(grades[0]!)
    notes.push(
      better
        ? `You went ${grades.join(' → ')} across the days. It got better as you went.`
        : `You went ${grades.join(' → ')}. The first day was your best one.`,
    )
  }

  return notes.slice(0, 4)
}
