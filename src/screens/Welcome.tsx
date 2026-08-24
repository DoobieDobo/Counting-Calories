import { useGame } from '../state/GameContext'

export function Welcome() {
  const { dispatch } = useGame()

  return (
    <div className="screen screen-welcome">
      <div className="welcome-mark" aria-hidden="true">
        🛒
      </div>

      <div className="screen-head">
        <p className="eyebrow">Counting Calories</p>
        <h1>The prices are in calories.</h1>
        <p className="lede">
          Pick a dish, then shop for it one ingredient at a time. Fresh tomatoes or a jar of
          sweet Pinoy spaghetti sauce? Deep-fried or air-fried? Every choice comes off the same
          budget — and the budget is yours, worked out from your own numbers.
        </p>
      </div>

      <div className="welcome-steps">
        <div className="welcome-step card">
          <span className="welcome-step-num">1</span>
          <h3>Tell it about you</h3>
          <p className="lede">Height, weight, and how much you move. It works out your daily energy.</p>
        </div>
        <div className="welcome-step card">
          <span className="welcome-step-num">2</span>
          <h3>Pick a goal</h3>
          <p className="lede">Lose, maintain, or gain. That sets the budget for each meal.</p>
        </div>
        <div className="welcome-step card">
          <span className="welcome-step-num">3</span>
          <h3>Go shopping</h3>
          <p className="lede">Five menus, thirty-nine dishes, and a checkout that says no.</p>
        </div>
      </div>

      <div className="btn-row">
        <button type="button" className="btn" onClick={() => dispatch({ type: 'GOTO', phase: 'mode' })}>
          Start shopping
        </button>
      </div>

      <p className="disclaimer">
        A game, not medical advice. The calorie figures are standard reference values and the
        budget comes from a well-known estimating formula — useful for building intuition, not
        for managing a health condition.
      </p>
    </div>
  )
}
