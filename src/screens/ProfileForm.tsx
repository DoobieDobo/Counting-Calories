import { useState, type FormEvent } from 'react'
import {
  ACTIVITY_LEVELS,
  GOALS,
  convert,
  type ActivityLevel,
  type Goal,
  type Profile,
  type Sex,
} from '../engine/calories'
import { useGame } from '../state/GameContext'

type Units = 'metric' | 'imperial'

const SEXES: { id: Sex; label: string }[] = [
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
  { id: 'unspecified', label: 'Prefer not to say' },
]

/**
 * Where the budget comes from.
 *
 * Age and sex are here because the Mifflin-St Jeor equation needs them, not
 * because the game wants them — hence the "prefer not to say" option, which
 * uses the midpoint of the two sex constants and lands within about 80 calories
 * of either answer.
 */
export function ProfileForm() {
  const { state, dispatch } = useGame()
  const seat = state.players.length + 1
  const isCoop = state.mode === 'coop'

  const [units, setUnits] = useState<Units>('metric')
  const [name, setName] = useState(isCoop ? `Player ${seat}` : '')
  const [cm, setCm] = useState('170')
  const [feet, setFeet] = useState('5')
  const [inches, setInches] = useState('7')
  const [kg, setKg] = useState('70')
  const [lb, setLb] = useState('154')
  const [age, setAge] = useState('30')
  const [sex, setSex] = useState<Sex>('unspecified')
  const [activity, setActivity] = useState<ActivityLevel>('light')
  const [goal, setGoal] = useState<Goal>('maintain')
  const [error, setError] = useState<string | null>(null)

  function submit(event: FormEvent) {
    event.preventDefault()

    const heightCm =
      units === 'metric' ? Number(cm) : convert.feetInchesToCm(Number(feet) || 0, Number(inches) || 0)
    const weightKg = units === 'metric' ? Number(kg) : convert.poundsToKg(Number(lb))
    const ageYears = Number(age)

    if (!Number.isFinite(heightCm) || heightCm < 100 || heightCm > 250) {
      setError('That height looks off — enter something between 100 cm and 250 cm (3\'3" and 8\'2").')
      return
    }
    if (!Number.isFinite(weightKg) || weightKg < 30 || weightKg > 300) {
      setError('That weight looks off — enter something between 30 kg and 300 kg (66 lb and 660 lb).')
      return
    }
    if (!Number.isFinite(ageYears) || ageYears < 13 || ageYears > 100) {
      setError('Enter an age between 13 and 100.')
      return
    }

    const profile: Profile = {
      name: name.trim() || (isCoop ? `Player ${seat}` : 'You'),
      heightCm,
      weightKg,
      age: ageYears,
      sex,
      activity,
      goal,
    }

    setError(null)
    dispatch({ type: 'ADD_PLAYER', profile })
  }

  return (
    <form className="screen" onSubmit={submit}>
      <div className="screen-head">
        <p className="eyebrow">{isCoop ? `Player ${seat}` : 'Step 2 of 3'}</p>
        <h1>{isCoop ? `Player ${seat}, your numbers` : 'Your numbers'}</h1>
        <p className="lede">
          This is only used to work out a calorie budget, and it never leaves your browser.
        </p>
      </div>

      <fieldset className="field-group card">
        <legend>About you</legend>

        <label className="field">
          <span className="field-label">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isCoop ? `Player ${seat}` : 'You'}
            maxLength={24}
          />
        </label>

        <div className="units-toggle" role="group" aria-label="Units">
          <button
            type="button"
            className={units === 'metric' ? 'units-active' : ''}
            onClick={() => setUnits('metric')}
            aria-pressed={units === 'metric'}
          >
            cm / kg
          </button>
          <button
            type="button"
            className={units === 'imperial' ? 'units-active' : ''}
            onClick={() => setUnits('imperial')}
            aria-pressed={units === 'imperial'}
          >
            ft / lb
          </button>
        </div>

        {units === 'metric' ? (
          <div className="field-row">
            <label className="field">
              <span className="field-label">Height</span>
              <span className="field-input-unit">
                <input
                  type="number"
                  inputMode="decimal"
                  value={cm}
                  onChange={(e) => setCm(e.target.value)}
                  min={100}
                  max={250}
                />
                <span>cm</span>
              </span>
            </label>
            <label className="field">
              <span className="field-label">Weight</span>
              <span className="field-input-unit">
                <input
                  type="number"
                  inputMode="decimal"
                  value={kg}
                  onChange={(e) => setKg(e.target.value)}
                  min={30}
                  max={300}
                />
                <span>kg</span>
              </span>
            </label>
          </div>
        ) : (
          <div className="field-row">
            <label className="field">
              <span className="field-label">Height</span>
              <span className="field-input-unit">
                <input
                  type="number"
                  inputMode="numeric"
                  value={feet}
                  onChange={(e) => setFeet(e.target.value)}
                  min={3}
                  max={8}
                  aria-label="Height in feet"
                />
                <span>ft</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={inches}
                  onChange={(e) => setInches(e.target.value)}
                  min={0}
                  max={11}
                  aria-label="Height in inches"
                />
                <span>in</span>
              </span>
            </label>
            <label className="field">
              <span className="field-label">Weight</span>
              <span className="field-input-unit">
                <input
                  type="number"
                  inputMode="decimal"
                  value={lb}
                  onChange={(e) => setLb(e.target.value)}
                  min={66}
                  max={660}
                />
                <span>lb</span>
              </span>
            </label>
          </div>
        )}

        <div className="field-row">
          <label className="field field-narrow">
            <span className="field-label">Age</span>
            <input
              type="number"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min={13}
              max={100}
            />
          </label>

          <div className="field">
            <span className="field-label">
              Sex <span className="field-hint">— the formula needs it</span>
            </span>
            <div className="chip-row" role="group" aria-label="Sex">
              {SEXES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`chip${sex === s.id ? ' chip-active' : ''}`}
                  onClick={() => setSex(s.id)}
                  aria-pressed={sex === s.id}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className="field-group card">
        <legend>How much do you move?</legend>
        <div className="option-list">
          {ACTIVITY_LEVELS.map((level) => (
            <button
              key={level.id}
              type="button"
              className={`option-row${activity === level.id ? ' option-row-active' : ''}`}
              onClick={() => setActivity(level.id)}
              aria-pressed={activity === level.id}
            >
              <span className="option-row-main">
                <strong>{level.label}</strong>
                <span className="lede">{level.detail}</span>
              </span>
              <span className="num option-row-side">×{level.multiplier}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field-group card">
        <legend>Would you like to…</legend>
        <div className="option-list">
          {GOALS.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`option-row${goal === g.id ? ' option-row-active' : ''}`}
              onClick={() => setGoal(g.id)}
              aria-pressed={goal === g.id}
            >
              <span className="option-row-main">
                <strong>{g.label}</strong>
                <span className="lede">{g.detail}</span>
              </span>
              <span className="num option-row-side">
                {g.delta === 0 ? '±0' : g.delta > 0 ? `+${g.delta}` : g.delta}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="btn-row">
        <button type="submit" className="btn">
          {isCoop ? 'Add player' : 'Work out my budget'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => dispatch({ type: 'GOTO', phase: isCoop && state.players.length > 0 ? 'roster' : 'mode' })}
        >
          ← Back
        </button>
      </div>
    </form>
  )
}
