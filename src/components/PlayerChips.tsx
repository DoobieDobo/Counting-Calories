import type { Player } from '../state/gameReducer'

interface Props {
  players: readonly Player[]
  /** The player whose turn it is to tap, if any. */
  activeId?: string | null
  onRemove?: (id: string) => void
}

/** Colour per seat, so a player is recognisable at a glance all game. */
export const SEAT_COLORS = ['#1f7a4d', '#b8730f', '#3d7ea6', '#8e4a9e'] as const

export function seatColor(index: number): string {
  return SEAT_COLORS[index % SEAT_COLORS.length]!
}

export function PlayerChips({ players, activeId, onRemove }: Props) {
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
            <span className="num player-chip-target">{player.target.target.toLocaleString()}</span>
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
