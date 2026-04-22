import { useState } from 'react'
import { useGame } from './context/GameContext'
import ConfirmDialog from './components/ConfirmDialog'
import HomePage from './pages/HomePage'
import LobbyPage from './pages/LobbyPage'
import MatchPage from './pages/MatchPage'

export default function App() {
  const { matchState, leaveToHome } = useGame()
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)

  async function handleHomeClick() {
    if (matchState) {
      setShowLeaveDialog(true)
      return
    }

    await leaveToHome()
  }

  async function confirmLeaveToHome() {
    setShowLeaveDialog(false)
    await leaveToHome()
  }

  function cancelLeaveToHome() {
    setShowLeaveDialog(false)
  }

  let page = <HomePage />

  if (matchState?.status === 'Lobby') {
    page = <LobbyPage />
  } else if (matchState) {
    page = <MatchPage />
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button type="button" className="brand-button" onClick={handleHomeClick}>
          Wheel of Speed
        </button>
      </header>

      {page}

      <ConfirmDialog
        open={showLeaveDialog}
        title="Go back to home screen?"
        eyebrow="Leave match"
        description="Your current lobby or match view will close on this device."
        cancelLabel="Stay here"
        confirmLabel="Leave match"
        onCancel={cancelLeaveToHome}
        onConfirm={confirmLeaveToHome}
      />
    </div>
  )
}
