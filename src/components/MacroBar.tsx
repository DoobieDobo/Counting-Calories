import type { MacroSplit } from '../engine/nutrition'

interface Props {
  split: MacroSplit
  /** `micro` is the thin strip on a product card; `full` is labelled. */
  size?: 'micro' | 'full'
}

/**
 * Where the calories came from. Two carts costing the same can look completely
 * different here, which is the point of showing it at all.
 */
export function MacroBar({ split, size = 'full' }: Props) {
  const parts = [
    { key: 'protein', label: 'Protein', value: split.protein },
    { key: 'carbs', label: 'Carbs', value: split.carbs },
    { key: 'fat', label: 'Fat', value: split.fat },
  ] as const

  const empty = parts.every((p) => p.value <= 0)

  const pct = (n: number) => Math.round(n * 100)
  const title = empty
    ? 'Where the calories come from — nothing to show yet'
    : `Where the calories come from: ${pct(split.protein)}% protein, ${pct(split.carbs)}% carbs, ${pct(split.fat)}% fat`

  return (
    <div className={`macro macro-${size}`} title={title}>
      <div className="macro-track" aria-hidden={size === 'micro'}>
        {empty ? (
          <div className="macro-seg macro-empty" style={{ width: '100%' }} />
        ) : (
          parts.map((p) => (
            <div
              key={p.key}
              className={`macro-seg macro-${p.key}`}
              style={{ width: `${p.value * 100}%` }}
            />
          ))
        )}
      </div>

      {size === 'full' && (
        <ul className="macro-key">
          {parts.map((p) => (
            <li key={p.key}>
              <span className={`macro-dot macro-${p.key}`} aria-hidden="true" />
              {p.label} <strong className="num">{Math.round(p.value * 100)}%</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
