import { MacroBar } from '../components/MacroBar'
import { getDish } from '../data/dishes'
import { CATALOG } from '../data/products'
import {
  bestSwap,
  buildCart,
  canAfford,
  cartTotals,
  describeOption,
  findOption,
  formatQty,
} from '../engine/cart'
import { macroSplit } from '../engine/nutrition'
import { MEAL_LABELS } from '../engine/calories'
import { flagsFor } from '../data/dietary'
import { tableConcerns } from '../state/gameReducer'
import { useGame } from '../state/GameContext'

/**
 * The checkout. Refuses an over-budget cart, but never just says "no" — it
 * names the biggest single swap available, because "you're over" is a dead end
 * and "swap the sweet sauce for canned tomatoes, that's 176 calories" is a move.
 */
export function Cart() {
  const { state, dispatch } = useGame()
  const current = state.current
  const dish = current?.dishId ? getDish(current.dishId) : undefined
  if (!current || !dish) return null

  const lines = buildCart(dish, current.choices, CATALOG, current.servings)
  const totals = cartTotals(lines)
  const affordable = canAfford(totals.kcal, current.budget)
  const over = totals.kcal - current.budget
  const swap = affordable ? null : bestSwap(dish, current.choices, CATALOG, current.servings)

  const skipped = dish.slots.filter((s) => current.choices[s.id] === null)
  const skippedRequired = skipped.filter((s) => !s.optional)

  // Last chance to notice a flag before it's cooked.
  const concerns = tableConcerns(state.players)
  const flaggedLines = lines
    .map((line) => ({ line, flags: flagsFor(line.product.id, concerns) }))
    .filter((entry) => entry.flags.length > 0)
  const anyAvoid = flaggedLines.some((e) => e.flags.some((f) => f.level === 'avoid'))

  // The single most expensive line, so a full cart has something to point at.
  const priciest = lines.reduce<(typeof lines)[number] | null>(
    (max, line) => (!max || line.kcal > max.kcal ? line : max),
    null,
  )

  return (
    <div className="screen">
      <div className="screen-head">
        <p className="eyebrow">{MEAL_LABELS[current.slot]} · checkout</p>
        <h1>
          {dish.emoji} {dish.name}
        </h1>
        {current.servings > 1 && (
          <p className="lede">
            Cooking <strong>{current.servings} servings</strong> — everything below is the
            amount for the whole table.
          </p>
        )}
      </div>

      <div className="receipt card">
        <ul className="receipt-lines">
          {lines.map((line) => (
            <li key={line.slotId} className={priciest?.slotId === line.slotId ? 'receipt-priciest' : ''}>
              <button
                type="button"
                className="receipt-line"
                onClick={() =>
                  dispatch({
                    type: 'GOTO_INGREDIENT',
                    index: dish.slots.findIndex((s) => s.id === line.slotId),
                  })
                }
              >
                <span className="receipt-emoji" aria-hidden="true">
                  {line.product.emoji}
                </span>
                <span className="receipt-body">
                  <span className="receipt-name">{line.product.name}</span>
                  <span className="receipt-meta">
                    {line.slotLabel} · {formatQty(line.use, line.servings)}
                    {line.note && ` · ${line.note}`}
                  </span>
                </span>
                <span className="num receipt-kcal">{line.kcal.toLocaleString()}</span>
              </button>
            </li>
          ))}

          {skipped.map((slot) => (
            <li key={slot.id} className="receipt-skipped">
              <button
                type="button"
                className="receipt-line"
                onClick={() =>
                  dispatch({
                    type: 'GOTO_INGREDIENT',
                    index: dish.slots.findIndex((s) => s.id === slot.id),
                  })
                }
              >
                <span className="receipt-emoji" aria-hidden="true">
                  —
                </span>
                <span className="receipt-body">
                  <span className="receipt-name">No {slot.label.toLowerCase()}</span>
                  <span className="receipt-meta">Left out</span>
                </span>
                <span className="num receipt-kcal">0</span>
              </button>
            </li>
          ))}
        </ul>

        <div className={`receipt-total${affordable ? '' : ' receipt-total-over'}`}>
          <span>Total</span>
          <strong className="num">{totals.kcal.toLocaleString()}</strong>
          <span className="receipt-total-budget">
            of {current.budget.toLocaleString()} cal
          </span>
        </div>
      </div>

      <div className="card cart-macros">
        <h3>Where those calories came from</h3>
        <MacroBar split={macroSplit(totals)} />
        <ul className="macro-grams">
          <li>
            Protein <strong className="num">{Math.round(totals.protein)} g</strong>
          </li>
          <li>
            Carbs <strong className="num">{Math.round(totals.carbs)} g</strong>
          </li>
          <li>
            Fat <strong className="num">{Math.round(totals.fat)} g</strong>
          </li>
        </ul>
      </div>

      {!affordable && (
        <div className="notice notice-danger" role="alert">
          <strong>
            {over.toLocaleString()} calories over. You can't check this out as it stands.
          </strong>
          {swap && (
            <p>
              Biggest single saving: in <em>{swap.slotLabel}</em>, swap {swap.fromName} for{' '}
              {swap.toName} — that's <strong className="num">{swap.saving.toLocaleString()}</strong>{' '}
              calories back
              {swap.saving >= over ? ', which is enough on its own.' : '.'}
            </p>
          )}
          {!swap && <p>Every ingredient is already the cheapest on offer — leave something out.</p>}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              dispatch({
                type: 'GOTO_INGREDIENT',
                index: swap
                  ? dish.slots.findIndex((s) => s.id === swap.slotId)
                  : dish.slots.findIndex((s) => s.id === priciest?.slotId),
              })
            }
          >
            Go and change it
          </button>
        </div>
      )}

      {flaggedLines.length > 0 && (
        <div className={`notice ${anyAvoid ? 'notice-danger' : 'notice-warn'}`} role="note">
          <strong>
            {anyAvoid
              ? 'Some of this is on your avoid list.'
              : 'A few things here are worth a second look.'}
          </strong>
          <ul className="flagged-list">
            {flaggedLines.map(({ line, flags }) => (
              <li key={line.slotId}>
                <button
                  type="button"
                  className="flagged-item"
                  onClick={() =>
                    dispatch({
                      type: 'GOTO_INGREDIENT',
                      index: dish.slots.findIndex((s) => s.id === line.slotId),
                    })
                  }
                >
                  <span aria-hidden="true">{line.product.emoji}</span>
                  <span>
                    <strong>{line.product.name}</strong> — {flags.map((f) => `${f.label} (${f.why})`).join('; ')}
                  </span>
                  <span className="flagged-change">change</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="lede">
            Flagged from the obvious ingredients only — it can't know how something was made.
            Checking out anyway is fine; it's your cart.
          </p>
        </div>
      )}

      {affordable && skippedRequired.length > 0 && (
        <div className="notice notice-warn" role="note">
          You left out {skippedRequired.map((s) => s.label.toLowerCase()).join(' and ')}. That's
          allowed — it's your cart — but it's a fairly different dish now.
        </div>
      )}

      {affordable && priciest && lines.length > 1 && (
        <p className="lede cart-observation">
          Most expensive thing in the cart:{' '}
          <strong>
            {describeOption(
              priciest.product,
              findOption(
                dish.slots.find((s) => s.id === priciest.slotId)!,
                priciest.optionId,
              )!,
            )}
          </strong>{' '}
          at <span className="num">{priciest.kcal.toLocaleString()}</span> calories —{' '}
          {Math.round((priciest.kcal / Math.max(1, totals.kcal)) * 100)}% of the meal.
        </p>
      )}

      <div className="btn-row">
        <button
          type="button"
          className="btn"
          disabled={!affordable}
          onClick={() => dispatch({ type: 'CHECKOUT' })}
        >
          {affordable ? 'Check out' : `Over by ${over.toLocaleString()}`}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => dispatch({ type: 'GOTO_INGREDIENT', index: 0 })}
        >
          ← Back to the aisles
        </button>
      </div>
    </div>
  )
}
