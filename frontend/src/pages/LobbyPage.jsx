import { useGame } from '../context/GameContext'

export default function LobbyPage() {
  const { matchState, playerId, markReady } = useGame()
  const me = matchState.players.find((player) => player.playerId === playerId)

  return (
    <main className="page">
      <section className="card">
        <h1>Lobby</h1>
        <p>Share this code: <strong>{matchState.guidCode}</strong></p>
        <p>{matchState.lastMessage}</p>

        <ul className="list">
          {matchState.players.map((player) => (
            <li key={player.playerId}>
              <span>{player.name}</span>
              <span>{player.isReady ? 'Ready' : 'Not ready'}</span>
            </li>
          ))}
        </ul>

        <button onClick={markReady} disabled={me?.isReady}>Ready</button>
      </section>
    </main>
  )
}
