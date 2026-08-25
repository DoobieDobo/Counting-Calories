import { useEffect, useState } from 'react'
import { BudgetBar } from '../components/BudgetBar'
import { ProductCard } from '../components/ProductCard'
import { RollButton } from '../components/RollButton'
import { SlotProgress } from '../components/SlotProgress'
import { VotePanel } from '../components/VotePanel'
import { getDish } from '../data/dishes'
import { CATALOG } from '../data/products'
import { buildCart, cartTotals, formatQty, optionKcal } from '../engine/cart'
import { pick } from '../engine/random'
import { flagsFor } from '../data/dietary'
import { dayNumber, pickerFor, tableConcerns, turnsSoFar } from '../state/gameReducer'
import { PlayerChips } from '../components/PlayerChips'
import { useGame } from '../state/GameContext'
import { seatColor } from '../components/PlayerChips'

/**
 * The shop: one ingredient at a time, several varieties of it, and a budget
 * that keeps count. This screen is the game.
 */
export function Store() {
  const { state, dispatch } = useGame()
  const [preview, setPreview] = useState<number | undefined>(undefined)
  const [voting, setVoting] = useState(false)

  const current = state.current
  const dish = current?.dishId ? getDish(current.dishId) : undefined
  const slot = dish?.slots[current?.slotIndex ?? 0]

  // Each ingredient starts at the top of the screen. Without this, tapping an
  // option near the bottom of a long shelf leaves the page scrolled and the
  // sticky budget bar sitting over the next ingredient's question.
  const slotIndex = current?.slotIndex
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [slotIndex])

  if (!current || !dish || !slot) return null

  // The running total excludes the slot being decided, so re-choosing an
  // ingredient you already picked doesn't double-count it on the bar.
  const committed = buildCart(
    dish,
    { ...current.choices, [slot.id]: null },
    CATALOG,
    current.servings,
  )
  const spent = cartTotals(committed).kcal
  const chosen = current.choices[slot.id]

  const picker = pickerFor(state)
  const pickerIndex = picker ? state.players.findIndex((p) => p.id === picker.id) : -1
  const concerns = tableConcerns(state.players)

  function choose(optionId: string | null) {
    setPreview(undefined)
    dispatch({ type: 'CHOOSE_OPTION', slotId: slot!.id, optionId })
  }

  const isLastSlot = current.slotIndex === dish.slots.length - 1

  return (
    <div className="screen screen-store">
      <BudgetBar
        slot={current.slot}
        spent={spent}
        budget={current.budget}
        banked={state.banked}
        preview={preview}
        servings={current.servings}
        day={dayNumber(state)}
      />

      <div className="store-head">
        <p className="eyebrow">
          {dish.emoji} {dish.name}
          {current.servings > 1 && ` · cooking for ${current.servings}`}
        </p>
        <h1>{slot.prompt}</h1>
        {!slot.optional && (
          <p className="store-required">
            {slot.label} is core to this dish — you can still leave it out, but it won't be quite
            the same thing.
          </p>
        )}
      </div>

      <SlotProgress
        slots={dish.slots}
        currentIndex={current.slotIndex}
        choices={current.choices}
        onJump={(index) => dispatch({ type: 'GOTO_INGREDIENT', index })}
      />

      {picker && !voting && (
        <>
          <div className="picker-banner" style={{ '--seat': seatColor(pickerIndex) } as React.CSSProperties}>
            <span className="player-chip-dot" aria-hidden="true" />
            <span>
              <strong>{picker.profile.name}</strong> is picking this one. Everyone gets a say —
              only they get to tap.
            </span>
          </div>
          <PlayerChips players={state.players} activeId={picker.id} turns={turnsSoFar(state)} />
        </>
      )}

      {voting ? (
        <VotePanel
          title={slot.label}
          choices={slot.options.map((option) => {
            const product = CATALOG[option.productId]!
            // The vote panel must not be blind to a flag the shelf shows.
            const warn = flagsFor(product.id, concerns)
              .map((f) => f.label)
              .join(', ')
            return {
              id: option.id,
              label: `${product.name} · ${optionKcal(product, option.use, current.servings)} cal`,
              sublabel: `${product.pack} — uses ${formatQty(option.use, current.servings)}${warn ? ` · ⚠ ${warn}` : ''}`,
            }
          })}
          players={state.players}
          onResolve={(id) => {
            setVoting(false)
            choose(id)
          }}
          onCancel={() => setVoting(false)}
        />
      ) : (
        <div className="shelf">
          {slot.options.map((option) => {
            const product = CATALOG[option.productId]
            if (!product) return null
            return (
              <ProductCard
                key={option.id}
                option={option}
                product={product}
                selected={chosen === option.id}
                spent={spent}
                budget={current.budget}
                servings={current.servings}
                concerns={concerns}
                onSelect={() => choose(option.id)}
                onPreview={setPreview}
              />
            )
          })}

          <button
            type="button"
            className={`product product-skip${chosen === null ? ' product-selected' : ''}`}
            onClick={() => choose(null)}
            aria-pressed={chosen === null}
          >
            <span className="product-emoji" aria-hidden="true">
              🚫
            </span>
            <span className="product-body">
              <span className="product-name">Leave it out</span>
              <span className="product-use">
                {slot.optional
                  ? 'Not everything needs to go in the cart.'
                  : "You'll notice it missing — but it's free."}
              </span>
            </span>
            <span className="product-price">
              <strong className="num">0</strong>
              <span className="product-price-unit">cal</span>
            </span>
          </button>
        </div>
      )}

      {!voting && (
        <div className="btn-row store-actions">
          <RollButton
            label="Pick one for me"
            onRoll={() => {
              const option = pick(slot.options)
              if (option) choose(option.id)
            }}
          />
          {state.mode === 'coop' && state.players.length > 1 && (
            <button type="button" className="btn btn-ghost" onClick={() => setVoting(true)}>
              🗳️ Call a vote
            </button>
          )}
          {current.slotIndex > 0 && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => dispatch({ type: 'GOTO_INGREDIENT', index: current.slotIndex - 1 })}
            >
              ← Back
            </button>
          )}
          {isLastSlot && slot.id in current.choices && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => dispatch({ type: 'REVIEW_CART' })}
            >
              Go to the checkout →
            </button>
          )}
          <AbandonRun />
        </div>
      )}
    </div>
  )
}

/**
 * A way out of a run mid-game. Without it the only reset lives on the day
 * summary, three finished meals away — which meant a run you no longer wanted
 * (or one restored from an old save) was effectively a trap.
 */
function AbandonRun() {
  const { state, dispatch } = useGame()
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <span className="abandon">
        <span className="abandon-ask">
          Start today over?
          {state.days.length > 0 &&
            ` Day${state.days.length === 1 ? '' : 's'} 1${state.days.length > 1 ? `–${state.days.length}` : ''} stay${state.days.length === 1 ? 's' : ''} banked.`}
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => dispatch({ type: 'ABANDON_DAY' })}
        >
          Yes, start today over
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>
          Keep shopping
        </button>
      </span>
    )
  }

  return (
    <button type="button" className="btn btn-ghost abandon-trigger" onClick={() => setConfirming(true)}>
      Start this day over
    </button>
  )
}
