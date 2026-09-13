import { CATALOG } from '../data/products'
import type { Dish } from '../data/types'
import { isSkipped, type Choices } from '../engine/cart'

interface Props {
  dish: Dish
  choices: Choices
  onOpen: (slotId: string) => void
}

/**
 * Every ingredient at once, arranged around the pot, instead of one shelf per
 * screen. The ring only repositions the tokens visually — the underlying list
 * stays in the dish's own slot order, so keyboard and screen-reader users
 * still move through ingredients in a sensible sequence, not by pixel angle.
 * The same list collapses to a plain stack under the mobile breakpoint.
 */
export function Pot({ dish, choices, onOpen }: Props) {
  return (
    <div className="pot-stage">
      <div className="pot-center" aria-hidden="true">
        <span className="pot-emoji">{dish.emoji}</span>
      </div>

      <ol className="pot-ring" style={{ '--n': dish.slots.length } as React.CSSProperties}>
        {dish.slots.map((slot, i) => {
          const decided = slot.id in choices
          const skipped = decided && isSkipped(choices, slot.id)
          const sample = CATALOG[slot.options[0]?.productId ?? '']

          return (
            <li key={slot.id} style={{ '--i': i } as React.CSSProperties}>
              <button
                type="button"
                className={[
                  'pot-token',
                  decided && !skipped ? 'pot-token-done' : '',
                  skipped ? 'pot-token-skipped' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onOpen(slot.id)}
              >
                <span className="pot-token-emoji" aria-hidden="true">
                  {skipped ? '🚫' : decided ? '✓' : (sample?.emoji ?? '❔')}
                </span>
                <span className="pot-token-label">
                  {slot.label}
                  {skipped && <span className="visually-hidden"> (left out)</span>}
                  {decided && !skipped && <span className="visually-hidden"> (chosen)</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
