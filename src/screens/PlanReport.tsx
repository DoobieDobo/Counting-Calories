import { useState } from 'react'
import { MacroBar } from '../components/MacroBar'
import { getDish } from '../data/dishes'
import { CATALOG } from '../data/products'
import { buildCart } from '../engine/cart'
import { MEAL_LABELS } from '../engine/calories'
import { macroSplit, produceLines } from '../engine/nutrition'
import { formatAmount, formatShare, shoppingByAisle, shoppingTotal } from '../engine/shopping'
import { suggestPlan } from '../engine/suggest'
import {
  PLAN_DAYS,
  RUN_MEALS,
  dayTarget,
  portionWeights,
  tableConcerns,
} from '../state/gameReducer'
import type { CompletedDay, Player } from '../state/gameReducer'
import { useGame } from '../state/GameContext'
import { clear } from '../state/persistence'

interface Props {
  days: readonly CompletedDay[]
  players: readonly Player[]
  /**
   * Set when reading a round back out of the archive rather than finishing one.
   * The report is otherwise identical: it was always a pure function of the
   * days and the table, so an old round renders through the same code.
   */
  saved?: { finishedAt: number; onBack: () => void }
}

/**
 * What you get for finishing three days: the plan you built, the shopping list
 * behind it, what the three days say about how you shop, and a suggested next
 * three days assembled from what actually worked.
 */
export function PlanReport({ days, players, saved }: Props) {
  const { dispatch } = useGame()
  // Collapsed by default: the list is for shopping, and shopping wants one
  // number per ingredient. Whose share is whose only matters at the stove.
  // Declared before the early return — a hook cannot run conditionally.
  const [showShares, setShowShares] = useState(false)

  if (days.length === 0) return null

  // A solo shopper has nothing to divide, so they keep the plain list.
  const split = players.length > 1
  const columns = tableColumns(players.length, showShares)
  const aisles = shoppingByAisle(days, split ? portionWeights(players) : [])
  const listTotal = shoppingTotal(days)
  const concerns = tableConcerns(players)
  const plan = suggestPlan(days, players, concerns)
  const patterns = findPatterns(days)

  const allMeals = days.flatMap((d) => d.meals)
  // Every meal in a block is cooked for the same table, so the first one speaks
  // for all of them; the roster is the fallback for an oddly-shaped save.
  const servings = allMeals[0]?.servings ?? Math.max(1, players.length)
  const totals = allMeals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.totals.kcal,
      protein: acc.protein + m.totals.protein,
      carbs: acc.carbs + m.totals.carbs,
      fat: acc.fat + m.totals.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )
  const target = dayTarget(players) * days.length

  return (
    <div className="screen report">
      <div className="screen-head">
        <p className="eyebrow">
          {days.length} days · meal plan
          {saved && ` · cooked ${whenFinished(saved.finishedAt)}`}
        </p>
        <h1>What you cooked, and what to buy</h1>
        <p className="lede">
          {allMeals.length} meals across {days.length} days. Everything below adds up to one
          shopping list — this is the part you can take with you.
        </p>
      </div>

      <div className="btn-row report-actions">
        {saved && (
          <button type="button" className="btn btn-ghost" onClick={saved.onBack}>
            ← All saved rounds
          </button>
        )}
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
          {split && " The Total column is what you buy — one shop for everyone."}
        </p>

        {split && (
          <div className="shares-toggle">
            <button
              type="button"
              className="btn btn-ghost"
              aria-expanded={showShares}
              aria-controls="shopping-aisles"
              onClick={() => setShowShares((on) => !on)}
            >
              {showShares ? '▾' : '▸'} Each person's share
            </button>
            {showShares && (
              <p className="lede shares-note">
                Split by each player's own calorie target, the same way the game dishes out a
                cooked meal — not by headcount. For serving up, not for shopping: the Total is
                still the number you buy.
              </p>
            )}
          </div>
        )}

        <div id="shopping-aisles">
        {aisles.map((aisle) =>
          split ? (
            <div key={aisle.category} className="aisle">
              <h3>
                {aisle.label}
                <span className="num aisle-kcal">{aisle.kcal.toLocaleString()} cal</span>
              </h3>
              <div className="aisle-table-wrap">
                <table className="aisle-table">
                  {/*
                    Explicit widths, because the layout is fixed and every aisle
                    is its own table: without them each one sizes to its own
                    longest ingredient line and the numbers land somewhere
                    different in every block. They also have to add to 100 in
                    both states, or collapsing leaves a band of dead space
                    where the per-person columns used to be.
                  */}
                  <colgroup>
                    <col style={{ width: `${columns.item}%` }} />
                    <col style={{ width: `${columns.total}%` }} />
                    {showShares &&
                      players.map((p) => (
                        <col key={p.id} style={{ width: `${columns.share}%` }} />
                      ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">Item</th>
                      <th scope="col" className="aisle-total-head">
                        Total
                      </th>
                      {showShares &&
                        players.map((p) => (
                          <th key={p.id} scope="col" className="aisle-share-head">
                            {p.profile.name}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {aisle.lines.map((line) => (
                      <tr key={`${line.product.id}-${line.unit}`}>
                        <th scope="row">
                          {/*
                            The flex layout lives on an inner span: a table cell
                            that is itself a flex container stops honouring the
                            fixed column width and collapses the name.
                          */}
                          <span className="aisle-item">
                            <span className="aisle-emoji" aria-hidden="true">
                              {line.product.emoji}
                            </span>
                            <span className="aisle-body">
                              <span className="aisle-name">{line.product.name}</span>
                              <span className="aisle-for">
                                for {line.usedIn.join(', ')} · {line.kcal.toLocaleString()} cal
                              </span>
                            </span>
                          </span>
                        </th>
                        <td className="num aisle-total">
                          <strong>{formatAmount(line)}</strong>
                        </td>
                        {showShares &&
                          line.perPlayer.map((share, i) => (
                            <td key={players[i]?.id ?? i} className="num aisle-share">
                              {formatShare(share)}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
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
          ),
        )}
        </div>

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

      {/*
        ── Suggested next block ───────────────────────────────────────────
        Only on a round you have just finished. On one pulled off the shelf
        it would be advice about what to cook after a week you already ate.
      */}
      {!saved && (
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
      )}

      {saved ? (
        <div className="btn-row report-actions">
          <button type="button" className="btn" onClick={saved.onBack}>
            ← All saved rounds
          </button>
        </div>
      ) : (
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
      )}
    </div>
  )
}

/** "today", "yesterday", or the date — enough to tell two rounds apart. */
function whenFinished(at: number): string {
  const day = new Date(at)
  const today = new Date()
  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const daysAgo = Math.round((midnight(today) - midnight(day)) / 86_400_000)

  if (daysAgo <= 0) return 'today'
  if (daysAgo === 1) return 'yesterday'
  if (daysAgo < 7) return `${daysAgo} days ago`
  return day.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

/**
 * Column widths for the shopping table, as percentages that always sum to 100.
 *
 * A share column is capped so that a table of two doesn't end up with two
 * enormous columns and a squeezed ingredient name; past four players the cap
 * stops biting and they divide what is left of the row.
 */
function tableColumns(players: number, showShares: boolean): {
  item: number
  total: number
  share: number
} {
  if (!showShares || players === 0) return { item: 74, total: 26, share: 0 }

  const share = Math.min(18, 52 / players)
  return { item: 100 - 12 - share * players, total: 12, share }
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
