import { useState } from 'react'
import { PlayerChips } from '../components/PlayerChips'
import { RollButton } from '../components/RollButton'
import { VotePanel } from '../components/VotePanel'
import { MENUS_BY_MEAL, getMenu } from '../data/menus'
import { dishesForMenu } from '../data/dishes'
import type { MenuId } from '../data/types'
import { MEAL_LABELS } from '../engine/calories'
import { pick } from '../engine/random'
import { PLAN_DAYS, dayNumber } from '../state/gameReducer'
import { useGame } from '../state/GameContext'

export function MenuSelect() {
  const { state, dispatch } = useGame()
  const [voting, setVoting] = useState(false)
  if (!state.current) return null

  const { slot, budget, servings } = state.current
  const available = MENUS_BY_MEAL[slot].map((id) => getMenu(id)).filter((m) => m !== undefined)

  function choose(menuId: MenuId) {
    dispatch({ type: 'CHOOSE_MENU', menuId })
  }

  return (
    <div className="screen">
      <div className="screen-head">
        <p className="eyebrow">
          Day {dayNumber(state)} of {PLAN_DAYS} · {MEAL_LABELS[slot]} ·{' '}
          <span className="num">{budget.toLocaleString()}</span> calories to spend
          {servings > 1 && ` · ${servings} servings`}
        </p>
        <h1>{state.mode === 'coop' ? 'Pick a menu together' : 'Pick a menu'}</h1>
        {state.banked > 0 && (
          <p className="lede">
            You carried <strong className="num">{state.banked.toLocaleString()}</strong> calories
            over from earlier. They're already in the budget above.
          </p>
        )}
      </div>

      {state.mode === 'coop' && <PlayerChips players={state.players} />}

      {voting ? (
        <VotePanel
          title="Which menu?"
          choices={available.map((m) => ({ id: m.id, label: `${m.emoji} ${m.name}`, sublabel: m.blurb }))}
          players={state.players}
          onResolve={(id) => {
            setVoting(false)
            choose(id as MenuId)
          }}
          onCancel={() => setVoting(false)}
        />
      ) : (
        <div className="menu-grid">
          {available.map((menu) => (
            <button
              key={menu.id}
              type="button"
              className="menu-card card"
              onClick={() => choose(menu.id)}
            >
              <span className="menu-emoji" aria-hidden="true">
                {menu.emoji}
              </span>
              <h2>{menu.name}</h2>
              <p className="lede">{menu.blurb}</p>
              <span className="menu-count num">{dishesForMenu(menu.id).length} dishes</span>
            </button>
          ))}
        </div>
      )}

      {!voting && (
        <div className="btn-row">
          <RollButton
            label="Surprise me"
            onRoll={() => {
              const menu = pick(available)
              if (menu) choose(menu.id)
            }}
          />
          {state.mode === 'coop' && state.players.length > 1 && (
            <button type="button" className="btn btn-ghost" onClick={() => setVoting(true)}>
              🗳️ Put it to a vote
            </button>
          )}
        </div>
      )}
    </div>
  )
}
