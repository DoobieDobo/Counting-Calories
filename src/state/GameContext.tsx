import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import { gameReducer, type Action, type GameState } from './gameReducer'
import { initialGameState, save } from './persistence'

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

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside a GameProvider')
  return ctx
}
