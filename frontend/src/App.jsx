import { useGame } from './context/GameContext'
import HomePage from './pages/HomePage'
import LobbyPage from './pages/LobbyPage'
import MatchPage from './pages/MatchPage'

export default function App() {
  const { matchState } = useGame()

  if (!matchState) {
    return <HomePage />
  }

  if (matchState.status === 'Lobby') {
    return <LobbyPage />
  }

  return <MatchPage />
}
