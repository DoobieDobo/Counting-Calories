import { useState } from 'react'
import { PlayerChips } from '../components/PlayerChips'
import { RollButton } from '../components/RollButton'
import { VotePanel } from '../components/VotePanel'
import { getMenu } from '../data/menus'
import { dishesForMenu } from '../data/dishes'
import { CATALOG } from '../data/products'
import { cheapestBuild, priciestBuild } from '../engine/cart'
import { pick } from '../engine/random'
import { soleMenuFor } from '../state/gameReducer'
import { useGame } from '../state/GameContext'

export function DishSelect() {
  const { state, dispatch } = useGame()
  const [voting, setVoting] = useState(false)
  if (!state.current?.menuId) return null

  const menu = getMenu(state.current.menuId)
  // When the meal slot only has one menu there is nothing to go back to.
  const hasMenuChoice = soleMenuFor(state.current.slot) === null
  const dishes = dishesForMenu(state.current.menuId)
  const budget = state.current.budget

  return (
    <div className="screen">
      <div className="screen-head">
        <p className="eyebrow">
          {menu?.emoji} {menu?.name} · <span className="num">{budget.toLocaleString()}</span>{' '}
          calories to spend
        </p>
        <h1>What are you cooking?</h1>
        <p className="lede">
          The range under each dish is what it costs built as cheaply as possible, up to built
          without restraint. Most of that difference is choices you're about to make.
        </p>
      </div>

      {state.mode === 'coop' && <PlayerChips players={state.players} />}

      {voting ? (
        <VotePanel
          title="Which dish?"
          choices={dishes.map((d) => ({ id: d.id, label: `${d.emoji} ${d.name}`, sublabel: d.blurb }))}
          players={state.players}
          onResolve={(id) => {
            setVoting(false)
            dispatch({ type: 'CHOOSE_DISH', dishId: id })
          }}
          onCancel={() => setVoting(false)}
        />
      ) : (
        <div className="dish-grid">
          {dishes.map((dish) => {
            const low = cheapestBuild(dish, CATALOG)
            const high = priciestBuild(dish, CATALOG)
            const affordable = low <= budget
            return (
              <button
                key={dish.id}
                type="button"
                className={`dish-card card${affordable ? '' : ' dish-card-tight'}`}
                onClick={() => dispatch({ type: 'CHOOSE_DISH', dishId: dish.id })}
              >
                <span className="dish-emoji" aria-hidden="true">
                  {dish.emoji}
                </span>
                <span className="dish-body">
                  <strong className="dish-name">{dish.name}</strong>
                  <span className="lede dish-blurb">{dish.blurb}</span>
                  <span className="dish-range">
                    <span className="num">{low.toLocaleString()}</span>
                    <span className="dish-range-dash">–</span>
                    <span className="num">{high.toLocaleString()}</span>
                    <span className="dish-range-unit">cal</span>
                  </span>
                  {!affordable && (
                    <span className="dish-warn">
                      Even the leanest build is over budget — you'd have to skip something
                    </span>
                  )}
                </span>
                <span className="dish-slots num">{dish.slots.length} ingredients</span>
              </button>
            )
          })}
        </div>
      )}

      {!voting && (
        <div className="btn-row">
          <RollButton
            onRoll={() => {
              const dish = pick(dishes)
              if (dish) dispatch({ type: 'CHOOSE_DISH', dishId: dish.id })
            }}
          />
          {state.mode === 'coop' && state.players.length > 1 && (
            <button type="button" className="btn btn-ghost" onClick={() => setVoting(true)}>
              🗳️ Put it to a vote
            </button>
          )}
          {hasMenuChoice && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => dispatch({ type: 'GOTO', phase: 'menu' })}
            >
              ← Different menu
            </button>
          )}
        </div>
      )}
    </div>
  )
}
