import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import { GameProvider } from './context/GameContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>
)
