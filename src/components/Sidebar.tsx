import { useEffect, useState, useSyncExternalStore } from 'react'
import { PLAN_DAYS } from '../state/gameReducer'
import { useGame } from '../state/GameContext'
import { clearRounds, loadRounds, subscribeRounds } from '../state/rounds'

/**
 * The one piece of the game that is always there.
 *
 * Everything on it either goes somewhere you cannot otherwise reach (saved
 * rounds) or throws work away. The second kind all confirms first — a menu you
 * open by accident should not be able to bin two days of shopping.
 */
export function Sidebar() {
  const { state, dispatch } = useGame()
  const [open, setOpen] = useState(false)
  const [asking, setAsking] = useState<string | null>(null)

  // Subscribed rather than polled on phase change: React runs this child's
  // effects before the provider's, so a round finished on this very render
  // would not be on the shelf yet and the item would be missing exactly when
  // someone looks for it.
  const savedCount = useSyncExternalStore(subscribeRounds, () => loadRounds().length)

  // The sheet covers the screen on a phone, so leaving a screen closes it.
  useEffect(() => {
    setOpen(false)
    setAsking(null)
  }, [state.phase])

  const playing = state.players.length > 0
  const midRound = state.days.length > 0 || state.history.length > 0
  const midDay = state.current !== null

  function act(id: string, run: () => void) {
    if (asking === id) {
      run()
      setAsking(null)
      setOpen(false)
    } else {
      setAsking(id)
    }
  }

  interface Item {
    id: string
    label: string
    badge: number | null
    /** What to ask before doing it. Null for anything that destroys nothing. */
    confirm: string | null
    run: () => void
  }

  // Annotated on the literal, not on the filtered result: without it each entry
  // infers its own narrower shape and the type guard has nothing to guard.
  const candidates: (Item | false)[] = [
    savedCount > 0 && {
      id: 'saved',
      label: 'Saved rounds',
      badge: savedCount,
      confirm: null,
      run: () => dispatch({ type: 'GOTO', phase: 'saved' }),
    },
    playing && {
      id: 'restart',
      label: midRound ? 'Start this round over' : 'Start a new round',
      badge: null,
      confirm: midRound
        ? `Throw away ${state.days.length > 0 ? `day ${state.days.length + 1} and the ${state.days.length} before it` : 'this day'}?`
        : `Start ${PLAN_DAYS} fresh days?`,
      run: () => dispatch({ type: 'RESTART' }),
    },
    playing &&
      midDay && {
        id: 'day',
        label: 'Start this day over',
        badge: null,
        confirm: 'Throw away today and cook it again?',
        run: () => dispatch({ type: 'ABANDON_DAY' }),
      },
    playing && {
      id: 'players',
      label: 'Change who is playing',
      badge: null,
      // Not a warning for its own sake: every budget and every portion is
      // computed from the table, so days cooked by a different one cannot be
      // carried forward. START_RUN clears the block for exactly this reason.
      confirm: 'Changing the table starts the round again. Carry on?',
      run: () => dispatch({ type: 'GOTO', phase: 'roster' }),
    },
    savedCount > 0 && {
      id: 'wipe',
      label: 'Delete saved rounds',
      badge: null,
      confirm: `Delete all ${savedCount}? This cannot be undone.`,
      run: () => clearRounds(),
    },
  ]
  const items = candidates.filter((item): item is Item => item !== false)

  if (items.length === 0) return null

  return (
    <>
      <button
        type="button"
        className="sidebar-toggle"
        aria-expanded={open}
        aria-controls="sidebar"
        onClick={() => setOpen((on) => !on)}
      >
        {open ? '✕' : '☰'}
        <span className="visually-hidden">{open ? 'Close the menu' : 'Open the menu'}</span>
      </button>

      {open && <div className="sidebar-scrim" onClick={() => setOpen(false)} aria-hidden="true" />}

      <nav id="sidebar" className={`sidebar${open ? ' sidebar-open' : ''}`} aria-label="Game menu">
        <p className="sidebar-mark">
          <span aria-hidden="true">🛒</span> Counting Calories
        </p>

        <ul className="sidebar-items">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`sidebar-item${asking === item.id ? ' sidebar-item-asking' : ''}`}
                onClick={() => (item.confirm ? act(item.id, item.run) : item.run())}
              >
                {item.label}
                {item.badge !== null && <span className="num sidebar-badge">{item.badge}</span>}
              </button>

              {asking === item.id && item.confirm && (
                <div className="sidebar-confirm">
                  <p>{item.confirm}</p>
                  <button type="button" className="btn btn-ghost" onClick={() => act(item.id, item.run)}>
                    Yes
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setAsking(null)}>
                    Cancel
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
