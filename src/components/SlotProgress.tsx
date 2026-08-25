import type { Slot } from '../data/types'
import type { Choices } from '../engine/cart'

interface Props {
  slots: readonly Slot[]
  currentIndex: number
  choices: Choices
  onJump: (index: number) => void
}

/**
 * The aisle you are walking down. Every earlier ingredient stays clickable —
 * changing your mind about the sauce three screens later is a normal thing to
 * want, and making the player restart the dish to do it would be miserable.
 */
export function SlotProgress({ slots, currentIndex, choices, onJump }: Props) {
  return (
    <nav className="slot-progress" aria-label="Ingredients">
      <ol>
        {slots.map((slot, i) => {
          const decided = slot.id in choices
          const skipped = choices[slot.id] === null
          const isCurrent = i === currentIndex
          const reachable = i <= currentIndex || decided

          return (
            <li key={slot.id}>
              <button
                type="button"
                className={[
                  'slot-pip',
                  isCurrent ? 'slot-pip-current' : '',
                  decided && !skipped ? 'slot-pip-done' : '',
                  skipped ? 'slot-pip-skipped' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                disabled={!reachable}
                onClick={() => onJump(i)}
                aria-current={isCurrent ? 'step' : undefined}
                title={slot.label}
              >
                <span className="visually-hidden">
                  {slot.label}
                  {skipped ? ' (skipped)' : decided ? ' (chosen)' : ''}
                </span>
                <span aria-hidden="true">{skipped ? '–' : decided ? '✓' : i + 1}</span>
              </button>
            </li>
          )
        })}
      </ol>
      <p className="slot-progress-caption">
        Ingredient <strong className="num">{currentIndex + 1}</strong> of{' '}
        <span className="num">{slots.length}</span>
      </p>
    </nav>
  )
}
