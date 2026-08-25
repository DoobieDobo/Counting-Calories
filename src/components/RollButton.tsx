import { useState } from 'react'

interface Props {
  label?: string
  onRoll: () => void
}

/** "I don't want to choose." A die, and a small spin so the roll feels rolled. */
export function RollButton({ label = 'Roll for me', onRoll }: Props) {
  const [spinning, setSpinning] = useState(false)

  function handleClick() {
    setSpinning(true)
    onRoll()
    window.setTimeout(() => setSpinning(false), 420)
  }

  return (
    <button type="button" className="btn btn-secondary roll-btn" onClick={handleClick}>
      <span className={`roll-die${spinning ? ' roll-die-spin' : ''}`} aria-hidden="true">
        🎲
      </span>
      {label}
    </button>
  )
}
