import { useState } from 'react'
import { SavedRoundCard } from '../components/SavedRoundCard'
import { MEAL_LABELS } from '../engine/calories'
import { PLAN_DAYS, dayNumber } from '../state/gameReducer'
import { useGame } from '../state/GameContext'
import { loadRounds } from '../state/rounds'
import { lastPlayedAt } from '../state/session'
import { PlanReport } from './PlanReport'

/**
 * The landing for someone coming back after a break.
 *
 * A returning player used to be the one person who never saw a landing screen
 * at all: the saved run was restored and the app dropped them straight onto a
 * shelf, so the shopping list they came back for was two taps into a menu they
 * had not found. This puts where-you-were and what-you-cooked in front of them
 * instead — but only after a real gap, so it never interrupts a session in
 * progress.
 */
export function WelcomeBack({ onContinue }: { onContinue: () => void }) {
  const { state, dispatch } = useGame()
  const [viewing, setViewing] = useState<string | null>(null)

  const rounds = loadRounds()
  const last = rounds[0]

  if (viewing && last && viewing === last.id) {
    return (
      <PlanReport
        days={last.days}
        players={last.players}
        saved={{ finishedAt: last.finishedAt, onBack: () => setViewing(null) }}
      />
    )
  }

  const mid = state.phase !== 'welcome' && state.players.length > 0
  const nextMeal = state.current ? MEAL_LABELS[state.current.slot].toLowerCase() : null

  return (
    <div className="screen">
      <div className="screen-head">
        <p className="eyebrow">{sinceLabel(lastPlayedAt())}</p>
        <h1>Welcome back.</h1>
        <p className="lede">
          {mid
            ? 'Your round is where you left it, and everything you have finished is still here.'
            : 'Everything you have cooked is still here.'}
        </p>
      </div>

      {mid && (
        <section className="card resume">
          <p className="eyebrow">Where you are up to</p>
          <h2>
            Day {dayNumber(state)} of {PLAN_DAYS}
            {nextMeal && <span className="resume-meal"> · {nextMeal} next</span>}
          </h2>
          <p className="lede">
            {state.players.map((p) => p.profile.name).join(', ')}
            {state.days.length > 0 &&
              ` · ${state.days.length} ${state.days.length === 1 ? 'day' : 'days'} banked`}
          </p>
          <div className="btn-row">
            <button type="button" className="btn" onClick={onContinue}>
              Continue where I left off
            </button>
          </div>
        </section>
      )}

      {last && (
        <section className="report-section">
          <h2>Your last finished round</h2>
          <SavedRoundCard round={last} onOpen={() => setViewing(last.id)} />
        </section>
      )}

      <div className="btn-row">
        {rounds.length > 0 && (
          <button
            type="button"
            /* Outlined rather than ghost: this is the button people come back
               for, and a ghost is indistinguishable from a heading here. */
            className={`btn${mid ? ' btn-secondary' : ''}`}
            onClick={() => {
              onContinue()
              dispatch({ type: 'GOTO', phase: 'saved' })
            }}
          >
            All saved rounds ({rounds.length})
          </button>
        )}
        {!mid && (
          <button type="button" className="btn btn-ghost" onClick={onContinue}>
            Back to the game
          </button>
        )}
      </div>
    </div>
  )
}

/** "Yesterday", "Last week" — how long the gap reads to a person. */
function sinceLabel(at: number | null): string {
  if (at === null) return 'Welcome back'
  const days = Math.round((Date.now() - at) / 86_400_000)
  if (days <= 1) return 'Since yesterday'
  if (days < 7) return `${days} days away`
  if (days < 14) return 'A week away'
  return `${Math.floor(days / 7)} weeks away`
}
