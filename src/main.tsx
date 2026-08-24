import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { GameProvider } from './state/GameContext'
import './styles/theme.css'
import './styles/components.css'
import './styles/screens.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

createRoot(root).render(
  <StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </StrictMode>,
)
