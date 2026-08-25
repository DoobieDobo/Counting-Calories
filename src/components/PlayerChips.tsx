import type { Player } from '../state/gameReducer'

interface Props {
  players: readonly Player[]
  /** The player whose turn it is to tap, if any. */
  activeId?: string | null
  /**
   * Turns taken so far, per seat. Worth showing at a big table: with six
   * players a five-slot breakfast genuinely leaves two people out of that meal,
   * and without a visible count that reads as a bug rather than a rotation.
   */
  turns?: readonly number[]
  onRemove?: (id: string) => void
}

/**
 * Colour per seat, so a player is recognisable at a glance all game. Six of
 * them, one per seat at a full table — `seatColor` wraps, so a short list would
 * silently give two players the same colour.
 *
 * Spread around the wheel and kept mid-saturation so each one holds its own
 * against both the warm paper and the dark grounds.
 */
export const SEAT_COLORS = [
  '#1f7a4d', // green
  '#b8730f', // amber
  '#3d7ea6', // blue
  '#8e4a9e', // purple
  '#b8453f', // red
  '#0f7c78', // teal
] as const

export function seatColor(index: number): string {
  return SEAT_COLORS[index % SEAT_COLORS.length]!
}

export function PlayerChips({ players, activeId, turns, onRemove }: Props) {
  return (
    <ul className="player-chips">
      {players.map((player, i) => {
        const active = player.id === activeId
        return (
          <li
            key={player.id}
            className={`player-chip${active ? ' player-chip-active' : ''}`}
            style={{ '--seat': seatColor(i) } as React.CSSProperties}
          >
            <span className="player-chip-dot" aria-hidden="true" />
            <span className="player-chip-name">{player.profile.name}</span>
            {turns ? (
              <span className="num player-chip-target">
                {turns[i] ?? 0} {turns[i] === 1 ? 'turn' : 'turns'}
              </span>
            ) : (
              <span className="num player-chip-target">{player.target.target.toLocaleString()}</span>
            )}
            {active && <span className="player-chip-turn">picking</span>}
            {onRemove && (
              <button
                type="button"
                className="player-chip-remove"
                onClick={() => onRemove(player.id)}
                aria-label={`Remove ${player.profile.name}`}
              >
                ×
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
