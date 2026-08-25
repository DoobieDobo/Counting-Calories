import type { Flagged } from '../data/dietary'

interface Props {
  flags: readonly Flagged[]
  /** How many to show before collapsing the rest into a count. */
  max?: number
}

/**
 * Why a product is flagged for the concerns this table has switched on.
 *
 * Deliberately a different visual language from the `fresh` / `canned` tags
 * beside it: those describe the product, these are addressed to the player.
 * Capped, because a single item can trip several concerns at once and a card
 * buried in warnings stops being readable.
 */
export function DietBadge({ flags, max = 2 }: Props) {
  if (flags.length === 0) return null

  const shown = flags.slice(0, max)
  const hidden = flags.length - shown.length

  return (
    <span className="diet-flags">
      {shown.map((flag) => (
        <span
          key={flag.concern}
          className={`diet-flag diet-flag-${flag.level}`}
          title={`${flag.label}: ${flag.why}`}
        >
          <span aria-hidden="true">{flag.level === 'avoid' ? '⚠' : '!'}</span>
          {flag.label}
          <span className="visually-hidden"> — {flag.why}</span>
        </span>
      ))}
      {hidden > 0 && (
        <span className="diet-flag diet-flag-more" title={flags.slice(max).map((f) => `${f.label}: ${f.why}`).join('\n')}>
          +{hidden}
        </span>
      )}
    </span>
  )
}
