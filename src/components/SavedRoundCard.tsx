import { shoppingList } from '../engine/shopping'
import { portionWeights } from '../state/gameReducer'
import type { SavedRound } from '../state/rounds'

/**
 * One finished round, at a glance: when, what was cooked, how it went, and how
 * much there is to buy.
 *
 * Shared by the saved list and the welcome-back screen so the two cannot drift
 * into describing the same round differently.
 */
export function SavedRoundCard({
  round,
  onOpen,
  children,
}: {
  round: SavedRound
  onOpen: () => void
  /** Anything that acts on the round rather than opening it — a delete, say. */
  children?: React.ReactNode
}) {
  const kcal = round.days.reduce((sum, d) => sum + d.verdict.kcal, 0)
  const items = shoppingList(round.days, portionWeights(round.players)).length

  return (
    <div className="card saved-round">
      <button type="button" className="saved-round-open" onClick={onOpen}>
        <span className="saved-round-when">{roundDate(round.finishedAt)}</span>
        <span className="saved-round-dishes">
          {round.days.flatMap((d) => d.meals.map((m) => m.dishEmoji)).join(' ')}
        </span>
        <span className="lede saved-round-meta">
          {round.days.length} days · {items} things to buy ·{' '}
          <span className="num">{kcal.toLocaleString()}</span> cal ·{' '}
          {round.players.map((p) => p.profile.name).join(', ')}
        </span>
        <span className="saved-round-grades">
          {round.days.map((d, i) => (
            <span key={i} className={`day-meal-grade grade-${d.verdict.grade.toLowerCase()}`}>
              {d.verdict.grade}
            </span>
          ))}
        </span>
      </button>
      {children}
    </div>
  )
}

/** How a round names itself in a list: "Tue, 25 Aug". */
export function roundDate(at: number): string {
  return new Date(at).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
