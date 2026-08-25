import { flagsFor, type ConcernId } from '../data/dietary'
import type { Product, SlotOption } from '../data/types'
import { formatQty, optionNutrition } from '../engine/cart'
import { macroSplit } from '../engine/nutrition'
import { DietBadge } from './DietBadge'
import { MacroBar } from './MacroBar'

interface Props {
  option: SlotOption
  product: Product
  selected: boolean
  /** Calories already committed, so the card can flag an unaffordable pick. */
  spent: number
  budget: number
  /** Portions being cooked — one per player. Scales the amount and the price. */
  servings: number
  /** Dietary concerns the table has switched on. */
  concerns: readonly ConcernId[]
  onSelect: () => void
  onPreview: (kcal: number | undefined) => void
}

/**
 * One item on the shelf.
 *
 * The card used to print the pack as sold ("1 kg jar") above the portion this
 * dish uses ("Uses 180 g"). The gap between those two is a genuinely useful
 * thing to know, but on the card it did the opposite of teaching it: three
 * numbers stacked together — pack, portion and price — and no way to tell which
 * one the calories belonged to. The portion is the one that costs you, so it is
 * the one that stays. `product.pack` is still on every product, but nothing
 * renders it now — the vote panel dropped it too.
 *
 * The name and the price share the top row. As a third grid column the price
 * sat right at desktop width and, under the narrow-screen rule, below the
 * macro bar and the tags — last on the card, on the only device this gets
 * played on.
 */
export function ProductCard({
  option,
  product,
  selected,
  spent,
  budget,
  servings,
  concerns,
  onSelect,
  onPreview,
}: Props) {
  const nutrition = optionNutrition(product, option.use, servings)
  const unaffordable = spent + nutrition.kcal > budget
  const flags = flagsFor(product.id, concerns)
  const flagged = flags.some((f) => f.level === 'avoid')

  return (
    <button
      type="button"
      className={`product${selected ? ' product-selected' : ''}${unaffordable ? ' product-over' : ''}${flagged ? ' product-flagged' : ''}`}
      onClick={onSelect}
      onMouseEnter={() => onPreview(nutrition.kcal)}
      onMouseLeave={() => onPreview(undefined)}
      onFocus={() => onPreview(nutrition.kcal)}
      onBlur={() => onPreview(undefined)}
      aria-pressed={selected}
    >
      <span className="product-emoji" aria-hidden="true">
        {product.emoji}
      </span>

      <span className="product-body">
        <span className="product-head">
          <span className="product-name">{product.name}</span>
          <span className="product-price">
            <strong className="num">{nutrition.kcal.toLocaleString()}</strong>
            <span className="product-price-unit">cal</span>
            {unaffordable && <span className="product-over-flag">over budget</span>}
          </span>
        </span>

        <span className="product-use">
          {formatQty(option.use, servings)}
          {servings > 1 && (
            <span className="product-scale">
              {' '}
              ({formatQty(option.use)} × {servings})
            </span>
          )}
          {option.note && <span className="product-note"> · {option.note}</span>}
        </span>

        <MacroBar split={macroSplit(nutrition)} size="micro" />

        <span className="product-tags">
          {product.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="product-tag">
              {tag}
            </span>
          ))}
        </span>

        <DietBadge flags={flags} />
      </span>
    </button>
  )
}
