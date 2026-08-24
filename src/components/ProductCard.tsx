import type { Product, SlotOption } from '../data/types'
import { formatQty, optionNutrition } from '../engine/cart'
import { macroSplit } from '../engine/nutrition'
import { MacroBar } from './MacroBar'

interface Props {
  option: SlotOption
  product: Product
  selected: boolean
  /** Calories already committed, so the card can flag an unaffordable pick. */
  spent: number
  budget: number
  onSelect: () => void
  onPreview: (kcal: number | undefined) => void
}

/**
 * One item on the shelf.
 *
 * The card shows the pack as sold *and* the portion this dish uses. That gap —
 * a 1 kg jar of sauce, of which the dish takes 180 g — is the single most
 * useful thing the game has to teach, and it costs nothing to display.
 */
export function ProductCard({
  option,
  product,
  selected,
  spent,
  budget,
  onSelect,
  onPreview,
}: Props) {
  const nutrition = optionNutrition(product, option.use)
  const unaffordable = spent + nutrition.kcal > budget

  return (
    <button
      type="button"
      className={`product${selected ? ' product-selected' : ''}${unaffordable ? ' product-over' : ''}`}
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
        <span className="product-name">{product.name}</span>
        <span className="product-pack">{product.pack}</span>

        <span className="product-use">
          Uses {formatQty(option.use)}
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
      </span>

      <span className="product-price">
        <strong className="num">{nutrition.kcal.toLocaleString()}</strong>
        <span className="product-price-unit">cal</span>
        {unaffordable && <span className="product-over-flag">over budget</span>}
      </span>
    </button>
  )
}
