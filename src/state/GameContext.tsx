import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import { gameReducer, type Action, type GameState } from './gameReducer'
import { initialGameState, save } from './persistence'
import { saveRound } from './rounds'

interface GameContextValue {
  state: GameState
  dispatch: (action: Action) => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, initialGameState)

  useEffect(() => {
    save(state)
  }, [state])

  /**
   * File a finished round the moment it is finished, rather than when the
   * player leaves the report — leaving is exactly what used to destroy it.
   * `saveRound` upserts on `roundId`, so re-renders, a reload with the report
   * open, and StrictMode's double-invoke all land on the same shelf slot.
   */
  useEffect(() => {
    if (state.phase !== 'plan-report' || state.days.length === 0) return
    saveRound({
      id: state.roundId,
      finishedAt: Date.now(),
      days: state.days,
      players: state.players,
      mode: state.mode,
    })
  }, [state.phase, state.days, state.players, state.mode, state.roundId])

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside a GameProvider')
  return ctx
}
