import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { GameProvider } from './state/GameContext'
import { applyTheme, loadTheme } from './state/theme'
import './styles/theme.css'
import './styles/components.css'
import './styles/screens.css'

// The inline script in index.html already pinned `data-theme` before paint;
// this re-runs it so the browser bar colour is set from the same decision.
applyTheme(loadTheme())

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

createRoot(root).render(
  <StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </StrictMode>,
)
