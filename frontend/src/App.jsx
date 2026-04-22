import { useEffect, useState } from 'react'
import { useGame } from './context/GameContext'
import ConfirmDialog from './components/ConfirmDialog'
import HomePage from './pages/HomePage'
import LobbyPage from './pages/LobbyPage'
import MatchPage from './pages/MatchPage'
import RulesPage from './pages/RulesPage'

export default function App() {
  const { matchState, leaveToHome } = useGame()
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    function handlePopState() {
      setPathname(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigateTo(path) {
    if (window.location.pathname === path) {
      return
    }

    window.history.pushState({}, '', path)
    setPathname(path)
  }

  async function handleHomeClick() {
    if (matchState) {
      setShowLeaveDialog(true)
      return
    }

    await leaveToHome()
    navigateTo('/')
  }

  async function confirmLeaveToHome() {
    setShowLeaveDialog(false)
    await leaveToHome()
    navigateTo('/')
  }

  function cancelLeaveToHome() {
    setShowLeaveDialog(false)
  }

  let page = <HomePage />

  if (pathname === '/rules') {
    page = <RulesPage onBack={() => navigateTo('/')} />
  } else if (matchState?.status === 'Lobby') {
    page = <LobbyPage />
  } else if (matchState) {
    page = <MatchPage />
  }

  return (
    <div className="app-shell">
      <header
        className="topbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button type="button" className="brand-button" onClick={handleHomeClick}>
          Wheel of Speed
        </button>
        <nav className="topbar-nav" aria-label="Primary" style={{ marginLeft: 'auto' }}>
          <a
            href="/rules"
            className="topbar-link"
            aria-current={pathname === '/rules' ? 'page' : undefined}
            style={{
              color: '#ffffff',
              textDecoration: 'none',
              textShadow: '0 0 10px rgba(79, 157, 255, 0.7), 0 0 18px rgba(79, 157, 255, 0.35)',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'none',
              margin: 0,
              padding: 0,
            }}
            onClick={(event) => {
              event.preventDefault()
              navigateTo('/rules')
            }}
          >
            Rules
          </a>
        </nav>
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
