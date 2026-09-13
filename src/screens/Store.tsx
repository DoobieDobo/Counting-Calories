import { useEffect, useState } from 'react'
import { BudgetBar } from '../components/BudgetBar'
import { IngredientCard } from '../components/IngredientCard'
import { PlayerChips, seatColor } from '../components/PlayerChips'
import { Pot } from '../components/Pot'
import { getDish } from '../data/dishes'
import { CATALOG } from '../data/products'
import { buildCart, cartTotals } from '../engine/cart'
import { dayNumber, pickerFor, tableConcerns, turnsSoFar } from '../state/gameReducer'
import { useGame } from '../state/GameContext'

/**
 * The shop: every ingredient floats around the pot at once, and tapping one
 * opens the shelf of options for it. Solo and co-op share this screen — the
 * picker banner and turn rotation only ever show up in co-op.
 */
export function Store() {
  const { state, dispatch } = useGame()
  const [preview, setPreview] = useState<number | undefined>(undefined)

  const current = state.current
  const dish = current?.dishId ? getDish(current.dishId) : undefined
  const openSlot = dish?.slots.find((s) => s.id === current?.openSlotId)

  // A freshly opened or closed card starts scrolled to the top, same reason
  // as the old per-slot stepper: a sticky budget bar sitting over a card you
  // scrolled halfway down reads as broken.
  const openSlotId = current?.openSlotId ?? null
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [openSlotId])

  if (!current || !dish) return null

  // Excludes the open slot so re-picking it doesn't double-count on the bar.
  // Moot on the pot view itself — nothing is "in flight" there.
  const committed = buildCart(
    dish,
    openSlot ? { ...current.choices, [openSlot.id]: null } : current.choices,
    CATALOG,
    current.servings,
  )
  const spent = cartTotals(committed).kcal

  const picker = pickerFor(state)
  const pickerIndex = picker ? state.players.findIndex((p) => p.id === picker.id) : -1
  const concerns = tableConcerns(state.players)
  const turns = turnsSoFar(state)
  const allDecided = dish.slots.every((s) => s.id in current.choices)

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

      {openSlot ? (
        <IngredientCard
          dish={dish}
          slot={openSlot}
          chosen={current.choices[openSlot.id]}
          spent={spent}
          budget={current.budget}
          servings={current.servings}
          concerns={concerns}
          mode={state.mode}
          players={state.players}
          picker={picker}
          turns={turns}
          onChoose={(optionId) => dispatch({ type: 'CHOOSE_OPTION', slotId: openSlot.id, optionId })}
          onToggle={(optionId) => dispatch({ type: 'TOGGLE_OPTION', slotId: openSlot.id, optionId })}
          onClose={() => dispatch({ type: 'OPEN_INGREDIENT', slotId: null })}
          onPreview={setPreview}
        />
      ) : (
        <>
          <div className="store-head">
            <p className="eyebrow">
              {dish.emoji} {dish.name}
              {current.servings > 1 && ` · cooking for ${current.servings}`}
            </p>
            <h1>What's going in?</h1>
            <p className="lede">Tap an ingredient to choose it.</p>
          </div>

          {picker && (
            <>
              <div
                className="picker-banner"
                style={{ '--seat': seatColor(pickerIndex) } as React.CSSProperties}
              >
                <span className="player-chip-dot" aria-hidden="true" />
                <span>
                  <strong>{picker.profile.name}</strong> is picking next. Everyone gets a say —
                  only they get to tap.
                </span>
              </div>
              <PlayerChips players={state.players} activeId={picker.id} turns={turns} />
            </>
          )}

          <Pot
            dish={dish}
            choices={current.choices}
            onOpen={(slotId) => dispatch({ type: 'OPEN_INGREDIENT', slotId })}
          />

          {allDecided && (
            <div className="btn-row store-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => dispatch({ type: 'REVIEW_CART' })}
              >
                Go to the checkout →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
