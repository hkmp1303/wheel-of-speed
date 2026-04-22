import { useGame } from '../context/GameContext'

export default function LobbyPage() {
  const { matchState, playerId, markReady, resetToHome } = useGame()
  const me = matchState.players.find((player) => player.playerId === playerId)

  return (
    <main className="page">
      <section className="card">
        <h1>Lobby</h1>
        <p>Share this code: <strong>{matchState.guidCode}</strong></p>
        <p>Difficulty: <strong>{matchState.difficulty ?? 'Medium'}</strong></p>
        <p>{matchState.lastMessage}</p>

        <ul className="list">
          {matchState.players.map((player) => (
            <li key={player.playerId}>
              <span>{player.name}</span>
              <span>{player.isReady ? 'Ready' : 'Not ready'}</span>
            </li>
          ))}
        </ul>

        <div className="actions">
          <button onClick={markReady} disabled={me?.isReady}>Ready</button>
          <button onClick={resetToHome}>Back to Home</button>
        </div>
      </section>
    </main>
  )
}
