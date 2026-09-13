import { useState } from 'react'
import type { ConcernId } from '../data/dietary'
import { flagsFor } from '../data/dietary'
import { CATALOG } from '../data/products'
import type { Dish, Slot } from '../data/types'
import { formatQty, optionKcal } from '../engine/cart'
import { pick } from '../engine/random'
import type { Mode, Player } from '../state/gameReducer'
import { PlayerChips, seatColor } from './PlayerChips'
import { ProductCard } from './ProductCard'
import { RollButton } from './RollButton'
import { VotePanel } from './VotePanel'

interface Props {
  dish: Dish
  slot: Slot
  chosen: string | string[] | null | undefined
  spent: number
  budget: number
  servings: number
  concerns: readonly ConcernId[]
  mode: Mode
  players: readonly Player[]
  picker: Player | null
  turns: readonly number[]
  onChoose: (optionId: string | null) => void
  /** Adds or removes one option from a `multi` slot's selection. */
  onToggle: (optionId: string) => void
  onClose: () => void
  onPreview: (kcal: number | undefined) => void
}

/** One ingredient, opened out of the pot: the shelf of options for it. */
export function IngredientCard({
  dish,
  slot,
  chosen,
  spent,
  budget,
  servings,
  concerns,
  mode,
  players,
  picker,
  turns,
  onChoose,
  onToggle,
  onClose,
  onPreview,
}: Props) {
  const [voting, setVoting] = useState(false)
  const pickerIndex = picker ? players.findIndex((p) => p.id === picker.id) : -1

  const selectedIds = chosen === null || chosen === undefined ? [] : Array.isArray(chosen) ? chosen : [chosen]
  // Distinct from "not decided yet" — the skip button only lights up once the
  // player has actually settled on nothing, same rule a single-select slot
  // has always used for `chosen === null`.
  const decidedEmpty = chosen !== undefined && selectedIds.length === 0

  function choose(optionId: string | null) {
    onPreview(undefined)
    onChoose(optionId)
  }

  function toggle(optionId: string) {
    onPreview(undefined)
    onToggle(optionId)
  }

  return (
    <div className="ingredient-card">
      <button type="button" className="btn btn-ghost ingredient-card-back" onClick={onClose}>
        ← Back to the pot
      </button>

      <div className="store-head">
        <p className="eyebrow">
          {dish.emoji} {dish.name}
          {servings > 1 && ` · cooking for ${servings}`}
        </p>
        <h1>{slot.prompt}</h1>
        {!slot.optional && (
          <p className="store-required">
            {slot.label} is core to this dish — you can still leave it out, but it won't be quite
            the same thing.
          </p>
        )}
        {slot.multi && <p className="lede">Tap as many as you like, then head back to the pot.</p>}
      </div>

      {picker && !voting && (
        <>
          <div className="picker-banner" style={{ '--seat': seatColor(pickerIndex) } as React.CSSProperties}>
            <span className="player-chip-dot" aria-hidden="true" />
            <span>
              <strong>{picker.profile.name}</strong>'s turn to pick. The table is open for
              discussion, but it's not a democracy unless {picker.profile.name} calls for a vote.
            </span>
          </div>
          <PlayerChips players={players} activeId={picker.id} turns={turns} />
        </>
      )}

      {voting ? (
        <VotePanel
          title={slot.label}
          choices={slot.options.map((option) => {
            const product = CATALOG[option.productId]!
            const warn = flagsFor(product.id, concerns)
              .map((f) => f.label)
              .join(', ')
            return {
              id: option.id,
              label: `${product.name} · ${optionKcal(product, option.use, servings)} cal`,
              sublabel: `Uses ${formatQty(option.use, servings)}${warn ? ` · ⚠ ${warn}` : ''}`,
            }
          })}
          players={players}
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
                selected={selectedIds.includes(option.id)}
                spent={spent}
                budget={budget}
                servings={servings}
                concerns={concerns}
                onSelect={() => (slot.multi ? toggle(option.id) : choose(option.id))}
                onPreview={onPreview}
              />
            )
          })}

          <button
            type="button"
            className={`product product-skip${decidedEmpty ? ' product-selected' : ''}`}
            onClick={() => choose(null)}
            aria-pressed={decidedEmpty}
          >
            <span className="product-emoji" aria-hidden="true">
              🚫
            </span>
            <span className="product-body">
              <span className="product-head">
                <span className="product-name">Leave it out</span>
                <span className="product-price">
                  <strong className="num">0</strong>
                  <span className="product-price-unit">cal</span>
                </span>
              </span>
              <span className="product-use">
                {slot.optional
                  ? 'Not everything needs to go in the cart.'
                  : "You'll notice it missing — but it's free."}
              </span>
            </span>
          </button>
        </div>
      )}

      {!voting && (
        <div className="btn-row store-actions">
          <RollButton
            label={slot.multi ? 'Add one for me' : 'Pick one for me'}
            ghost
            onRoll={() => {
              if (slot.multi) {
                const remaining = slot.options.filter((o) => !selectedIds.includes(o.id))
                const option = pick(remaining.length > 0 ? remaining : slot.options)
                if (option) toggle(option.id)
                return
              }
              const option = pick(slot.options)
              if (option) choose(option.id)
            }}
          />
          {mode === 'coop' && players.length > 1 && !slot.multi && (
            <button type="button" className="btn btn-ghost" onClick={() => setVoting(true)}>
              🗳️ Call a vote
            </button>
          )}
          {slot.multi && (
            // Tapping an option here doesn't close the card the way a
            // single-select slot does, so "Back to the pot" alone reads as
            // ambiguous about whether anything was kept. This is the
            // unambiguous confirm: it does exactly what the label says.
            <button
              type="button"
              className="btn ingredient-card-confirm"
              onClick={onClose}
            >
              Add to the pot and pick another ingredient →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
