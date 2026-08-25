import { MEAL_LABELS, GOALS, paceInKgPerWeek } from '../engine/calories'
import { RUN_MEALS, dayTarget, mealPot, type Player } from '../state/gameReducer'
import { useGame } from '../state/GameContext'

/** A pace as the player would say it: "about 0.3 kg a week". */
function weekly(dailyGap: number): string {
  const kg = paceInKgPerWeek(dailyGap)
  return `${kg.toFixed(kg < 1 ? 1 : 2)} kg`
}

/**
 * Why the number is not simply "maintenance, moved by the goal you picked".
 *
 * The old version of this said the budget had been "raised to meet a floor" and
 * left it there — true, and useless. What someone needs to know is whether the
 * game eased their pace or whether their own body is the reason, and those are
 * different sentences.
 */
function BudgetNote({ player, named }: { player: Player; named: boolean }) {
  const { target, profile } = player
  const who = named ? `${profile.name}: ` : ''

  switch (target.advice) {
    case 'underweight':
      return (
        <div className="notice notice-info" role="note">
          <strong>{who}No deficit set.</strong> Your height and weight put you in the underweight
          range, so the budget below is your maintenance level rather than a diet. Losing from
          here isn't something this game will help with — that's a conversation for a doctor,
          not a grocery.
        </div>
      )

    case 'near-underweight':
      return (
        <div className="notice notice-info" role="note">
          <strong>{who}Near the bottom of the healthy range.</strong> There's a budget below and
          you can play it, but you don't have much weight to lose for your height. It comes to
          about {weekly(target.pace)} a week, and the game won't go faster than that.
        </div>
      )

    case 'at-maintenance':
      return (
        <div className="notice notice-info" role="note">
          <strong>{who}Playing at maintenance.</strong> Your body already burns about{' '}
          <span className="num">{target.tdee.toLocaleString()}</span> calories a day, which is at
          or below the lowest intake this game will ever set. There's no deficit left to give, so
          the budget below is simply what you burn.
        </div>
      )

    case 'eased-pace':
      return (
        <div className="notice notice-warn" role="note">
          <strong>{who}Pace eased.</strong>{' '}
          {target.floored ? (
            <>
              Going faster would put you under{' '}
              <span className="num">{target.floor.toLocaleString()}</span> calories a day, so the
              budget below moves at about {weekly(target.pace)} a week instead.
            </>
          ) : (
            <>
              The budget below moves at about {weekly(target.pace)} a week — the fastest this game
              will go at your numbers.
            </>
          )}
        </div>
      )

    default:
      return null
  }
}

/**
 * The reveal: here is your number, here is where it came from, and here is how
 * it splits across the day. Showing the working matters — a budget handed down
 * without explanation is just a rule, and rules are easy to dismiss.
 */
export function BudgetReveal() {
  const { state, dispatch } = useGame()
  const isCoop = state.mode === 'coop'
  const first = state.players[0]
  if (!first) return null

  const total = dayTarget(state.players)
  const advised = state.players.filter((p) => p.target.advice !== 'none')

  return (
    <div className="screen">
      <div className="screen-head">
        <p className="eyebrow">Step 3 of 3</p>
        <h1>{isCoop ? "The table's budget" : 'Your budget'}</h1>
      </div>

      <div className="budget-hero card">
        <span className="eyebrow">Calories a day</span>
        <strong className="num budget-hero-figure">{total.toLocaleString()}</strong>
        {!isCoop && (
          <p className="lede">
            {first.target.bmr.toLocaleString()} at rest, {first.target.tdee.toLocaleString()} with
            how much you move
            {first.target.pace === 0
              ? '.'
              : `, then ${Math.abs(first.target.pace).toLocaleString()} ${
                  first.target.pace < 0 ? 'off' : 'on'
                } to ${first.profile.goal === 'lose' ? 'lose' : 'gain'} weight.`}
          </p>
        )}
        {isCoop && (
          <p className="lede">
            {state.players.length} players, pooled. You spend it as one cart, cooking{' '}
            {state.players.length} servings of every dish — a portion each.
          </p>
        )}
      </div>

      {!isCoop && (
        <div className="working card">
          <h3>How that was worked out</h3>
          <ul className="working-list">
            <li>
              <span>Resting metabolism</span>
              <strong className="num">{first.target.bmr.toLocaleString()}</strong>
            </li>
            <li>
              <span>Plus daily activity</span>
              <strong className="num">{first.target.tdee.toLocaleString()}</strong>
            </li>
            <li>
              {/*
                Naming the goal here when nothing was applied made the sum look
                broken: "Lose weight — 2,162" beside a maintenance of 2,162.
                The row says what happened to the number, not what was asked.
              */}
              <span>
                {first.target.pace === 0
                  ? 'Held at maintenance'
                  : GOALS.find((g) => g.id === first.profile.goal)?.label}
              </span>
              <strong className="num">{first.target.target.toLocaleString()}</strong>
            </li>
          </ul>
        </div>
      )}

      {advised.map((player) => (
        <BudgetNote key={player.id} player={player} named={isCoop} />
      ))}

      <div className="meal-split card">
        <h3>Split across the day</h3>
        <ul className="meal-split-list">
          {RUN_MEALS.map((slot) => (
            <li key={slot}>
              <span className="meal-split-name">{MEAL_LABELS[slot]}</span>
              <span className="meal-split-bar" aria-hidden="true">
                <span
                  style={{
                    width: `${(mealPot(state.players, slot, 0) / total) * 100}%`,
                  }}
                />
              </span>
              <strong className="num">{mealPot(state.players, slot, 0).toLocaleString()}</strong>
            </li>
          ))}
        </ul>
        <p className="lede">
          Anything you don't spend on one meal carries over to the next.
        </p>
      </div>

      <div className="btn-row">
        <button type="button" className="btn" onClick={() => dispatch({ type: 'START_RUN' })}>
          Open the menu
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => dispatch({ type: 'GOTO', phase: isCoop ? 'roster' : 'profile' })}
        >
          ← Change my answers
        </button>
      </div>
    </div>
  )
}
