import { MEAL_LABELS, type MealSlot } from '../engine/calories'

interface Props {
  slot: MealSlot
  spent: number
  budget: number
  /** Calories carried over from earlier meals, folded into `budget`. */
  banked?: number
  /** Cost of the option currently under the cursor, previewed on the bar. */
  preview?: number
  /** Portions being cooked. Shown so a pooled budget never looks unspendable. */
  servings?: number
}

/**
 * The running total, pinned to the top of the store.
 *
 * The bar previews the option the player is hovering or has focused, so the
 * cost of a choice is visible *before* committing it. That preview is the whole
 * mechanic — without it this is a receipt, not a game.
 */
export function BudgetBar({ slot, spent, budget, banked = 0, preview, servings = 1 }: Props) {
  const remaining = budget - spent
  const projected = spent + (preview ?? 0)
  const overBy = projected - budget

  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
  const previewPct =
    budget > 0 && preview ? Math.min(100 - pct, Math.max(0, (preview / budget) * 100)) : 0

  const tone = projected > budget ? 'over' : projected > budget * 0.85 ? 'tight' : 'ok'

  return (
    <div className={`budget-bar budget-bar-${tone}`}>
      <div className="budget-bar-top">
        <span className="eyebrow">
          {MEAL_LABELS[slot]} budget
          {servings > 1 && <span className="budget-bar-servings"> · {servings} servings</span>}
        </span>
        <span className="budget-bar-figure">
          <strong className="num">{spent.toLocaleString()}</strong>
          <span className="budget-bar-sep">/</span>
          <span className="num budget-bar-total">{budget.toLocaleString()}</span>
          <span className="budget-bar-unit">cal</span>
        </span>
      </div>

      <div
        className="budget-bar-track"
        role="progressbar"
        aria-valuenow={spent}
        aria-valuemin={0}
        aria-valuemax={budget}
        aria-label={`${MEAL_LABELS[slot]} budget: ${spent} of ${budget} calories spent`}
      >
        <div className="budget-bar-fill" style={{ width: `${pct}%` }} />
        {previewPct > 0 && (
          <div className="budget-bar-preview" style={{ left: `${pct}%`, width: `${previewPct}%` }} />
        )}
      </div>

      <div className="budget-bar-foot">
        {preview !== undefined && preview > 0 ? (
          overBy > 0 ? (
            <span className="budget-bar-warn">
              That puts you <strong className="num">{overBy.toLocaleString()}</strong> over
            </span>
          ) : (
            <span>
              That leaves <strong className="num">{(budget - projected).toLocaleString()}</strong> cal
            </span>
          )
        ) : (
          <span>
            <strong className="num">{Math.max(0, remaining).toLocaleString()}</strong> cal left
            {remaining < 0 && <span className="budget-bar-warn"> — over budget</span>}
          </span>
        )}
        {banked > 0 && <span className="budget-bar-banked">+{banked.toLocaleString()} carried over</span>}
      </div>
    </div>
  )
}
