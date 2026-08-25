import { useGame } from '../state/GameContext'

export function ModeSelect() {
  const { dispatch } = useGame()

  return (
    <div className="screen">
      <div className="screen-head">
        <p className="eyebrow">Step 1 of 3</p>
        <h1>Who's shopping?</h1>
      </div>

      <div className="mode-grid">
        <button
          type="button"
          className="mode-card card"
          onClick={() => dispatch({ type: 'SET_MODE', mode: 'solo' })}
        >
          <span className="mode-emoji" aria-hidden="true">
            🧍
          </span>
          <h2>On my own</h2>
          <p className="lede">Your numbers, your budget, your cart. Three meals to get through.</p>
        </button>

        <button
          type="button"
          className="mode-card card"
          onClick={() => dispatch({ type: 'SET_MODE', mode: 'coop' })}
        >
          <span className="mode-emoji" aria-hidden="true">
            🧑‍🤝‍🧑
          </span>
          <h2>Together</h2>
          <p className="lede">
            Two to six of you on one screen. Your budgets go into one pot and you cook a
            portion each — so every ingredient has to be argued for out loud.
          </p>
          <span className="mode-tag">Pass the device around</span>
        </button>
      </div>

      <div className="btn-row">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => dispatch({ type: 'GOTO', phase: 'welcome' })}
        >
          ← Back
        </button>
      </div>
    </div>
  )
}
