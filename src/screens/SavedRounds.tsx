import { useState } from 'react'
import { SavedRoundCard, roundDate } from '../components/SavedRoundCard'
import { PLAN_DAYS } from '../state/gameReducer'
import { useGame } from '../state/GameContext'
import { deleteRound, loadRounds, type SavedRound } from '../state/rounds'
import { PlanReport } from './PlanReport'

/**
 * Rounds you have finished, and the shopping lists behind them.
 *
 * This screen exists because the report used to live for exactly as long as you
 * stayed on it: starting the next round emptied the block and the save wrote
 * the empty one straight over the only copy.
 */
export function SavedRounds() {
  const { state, dispatch } = useGame()
  const [rounds, setRounds] = useState<SavedRound[]>(() => loadRounds())
  const [openId, setOpenId] = useState<string | null>(null)

  const open = rounds.find((r) => r.id === openId)
  if (open) {
    return (
      <PlanReport
        days={open.days}
        players={open.players}
        saved={{ finishedAt: open.finishedAt, onBack: () => setOpenId(null) }}
      />
    )
  }

  function remove(id: string) {
    deleteRound(id)
    setRounds(loadRounds())
  }

  const leave = () =>
    dispatch({ type: 'GOTO', phase: state.players.length > 0 ? 'budget' : 'welcome' })

  return (
    <div className="screen">
      <div className="screen-head">
        <p className="eyebrow">Saved rounds</p>
        <h1>{rounds.length === 0 ? 'Nothing saved yet' : 'What you have cooked'}</h1>
        <p className="lede">
          {rounds.length === 0
            ? `Finish ${PLAN_DAYS} days and the meal plan and its shopping list are kept here, so you can come back to them after you have started the next round.`
            : 'Every finished round, newest first. Open one for the plan and the shopping list exactly as they were.'}
        </p>
      </div>

      {rounds.length > 0 && (
        <ul className="saved-list">
          {rounds.map((round) => (
            <li key={round.id}>
              <SavedRoundCard round={round} onOpen={() => setOpenId(round.id)}>
                <DeleteRound
                  name={roundDate(round.finishedAt)}
                  onDelete={() => remove(round.id)}
                />
              </SavedRoundCard>
            </li>
          ))}
        </ul>
      )}

      <div className="btn-row">
        <button type="button" className="btn btn-ghost" onClick={leave}>
          ← Back to the game
        </button>
      </div>
    </div>
  )
}

/** Deleting a saved round cannot be undone, so it asks first. */
function DeleteRound({ name, onDelete }: { name: string; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <span className="abandon saved-round-delete">
        <span className="abandon-ask">Delete {name}?</span>
        <button type="button" className="btn btn-ghost" onClick={onDelete}>
          Yes, delete it
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>
          Keep it
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      className="btn btn-ghost saved-round-delete"
      onClick={() => setConfirming(true)}
    >
      Delete
    </button>
  )
}
