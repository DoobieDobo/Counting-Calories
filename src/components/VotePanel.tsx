import { useState } from 'react'
import { makeRng, pick } from '../engine/random'
import type { Player } from '../state/gameReducer'
import { seatColor } from './PlayerChips'

export interface VoteChoice {
  id: string
  label: string
  sublabel?: string
}

interface Props {
  title: string
  choices: readonly VoteChoice[]
  players: readonly Player[]
  onResolve: (choiceId: string) => void
  onCancel: () => void
}

/**
 * The tie-breaker for a table that can't agree.
 *
 * Everyone taps their pick, then the panel resolves it: most votes wins, and a
 * tie goes to a roll rather than to whoever argues longest. Deliberately not a
 * secret ballot — seeing that three of you wanted the cheap sauce is the useful
 * part.
 */
export function VotePanel({ title, choices, players, onResolve, onCancel }: Props) {
  const [votes, setVotes] = useState<Record<string, string>>({})
  const [result, setResult] = useState<{ choiceId: string; rolled: boolean } | null>(null)

  const allVoted = players.every((p) => p.id in votes)

  const tally = choices.map((choice) => ({
    choice,
    count: players.filter((p) => votes[p.id] === choice.id).length,
  }))

  function resolve() {
    const highest = Math.max(...tally.map((t) => t.count))
    const leaders = tally.filter((t) => t.count === highest).map((t) => t.choice.id)
    const rolled = leaders.length > 1
    // Seeded from the vote distribution so the same deadlock does not always
    // break the same way across a session.
    const seed = leaders.length + highest * 31 + Object.keys(votes).length * 7
    const winner = rolled ? pick(leaders, makeRng(seed))! : leaders[0]!
    setResult({ choiceId: winner, rolled })
  }

  if (result) {
    const winning = choices.find((c) => c.id === result.choiceId)
    return (
      <div className="vote-panel card" role="dialog" aria-label="Vote result">
        <h3>{result.rolled ? 'Tied — rolled for it' : 'The table has spoken'}</h3>
        <p className="vote-winner">{winning?.label}</p>
        {winning?.sublabel && <p className="lede">{winning.sublabel}</p>}
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => onResolve(result.choiceId)}>
            Take it
          </button>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Discuss again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="vote-panel card" role="dialog" aria-label={title}>
      <h3>{title}</h3>
      <p className="lede">Everyone picks. Most votes wins; a tie goes to the dice.</p>

      <div className="vote-grid">
        {players.map((player, i) => (
          <div key={player.id} className="vote-row" style={{ '--seat': seatColor(i) } as React.CSSProperties}>
            <span className="vote-player">
              <span className="player-chip-dot" aria-hidden="true" />
              {player.profile.name}
            </span>
            <div className="vote-options">
              {choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  className={`vote-option${votes[player.id] === choice.id ? ' vote-option-picked' : ''}`}
                  onClick={() => setVotes((v) => ({ ...v, [player.id]: choice.id }))}
                  aria-pressed={votes[player.id] === choice.id}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="btn-row">
        <button type="button" className="btn" disabled={!allVoted} onClick={resolve}>
          {allVoted ? 'Count the votes' : 'Waiting for everyone'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
