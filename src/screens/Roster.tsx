import { PlayerChips } from '../components/PlayerChips'
import { RUN_MEALS, dayTarget, mealPot } from '../state/gameReducer'
import { MEAL_LABELS } from '../engine/calories'
import { useGame } from '../state/GameContext'

const MAX_PLAYERS = 4

/** Co-op lobby: who is playing, and what the pooled budget comes to. */
export function Roster() {
  const { state, dispatch } = useGame()
  const full = state.players.length >= MAX_PLAYERS
  const ready = state.players.length >= 2

  return (
    <div className="screen">
      <div className="screen-head">
        <p className="eyebrow">Co-op</p>
        <h1>The table</h1>
        <p className="lede">
          Everyone's daily target goes into one pot. You'll pick the menu together and take turns
          committing each ingredient — so the whole cart gets talked about, not just decided.
        </p>
      </div>

      <PlayerChips
        players={state.players}
        onRemove={(id) => dispatch({ type: 'REMOVE_PLAYER', id })}
      />

      <div className="pot-summary card">
        <div className="pot-total">
          <span className="eyebrow">Pooled for the day</span>
          <strong className="num pot-figure">{dayTarget(state.players).toLocaleString()}</strong>
          <span className="pot-unit">calories</span>
        </div>
        <ul className="pot-breakdown">
          {RUN_MEALS.map((slot) => (
            <li key={slot}>
              <span>{MEAL_LABELS[slot]}</span>
              <strong className="num">{mealPot(state.players, slot, 0).toLocaleString()}</strong>
            </li>
          ))}
        </ul>
      </div>

      <div className="btn-row">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={full}
          onClick={() => dispatch({ type: 'GOTO', phase: 'profile' })}
        >
          {full ? 'Table is full (4)' : 'Add another player'}
        </button>
        <button
          type="button"
          className="btn"
          disabled={!ready}
          onClick={() => dispatch({ type: 'GOTO', phase: 'budget' })}
        >
          {ready ? "That's everyone" : 'Need at least two players'}
        </button>
      </div>
    </div>
  )
}
