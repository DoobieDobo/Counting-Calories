import { useState } from 'react'

interface Props {
  label?: string
  onRoll: () => void
  /** Store.tsx sits this beside "Call a vote", a btn-ghost — matching keeps
   *  neither action reading as more official than the other. */
  ghost?: boolean
}

/** "I don't want to choose." A die, and a small spin so the roll feels rolled. */
export function RollButton({ label = 'Roll for me', onRoll, ghost = false }: Props) {
  const [spinning, setSpinning] = useState(false)

  function handleClick() {
    setSpinning(true)
    onRoll()
    window.setTimeout(() => setSpinning(false), 420)
  }

  return (
    <button
      type="button"
      className={`btn ${ghost ? 'btn-ghost' : 'btn-secondary'} roll-btn`}
      onClick={handleClick}
    >
      <span className={`roll-die${spinning ? ' roll-die-spin' : ''}`} aria-hidden="true">
        🎲
      </span>
      {label}
    </button>
  )
}
