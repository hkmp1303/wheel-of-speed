import { useGame } from '../context/GameContext'

export default function LobbyPage() {
  const { matchState, playerId, markReady } = useGame()
  const me = matchState.players.find((player) => player.playerId === playerId)
  const lobbyStatus = matchState.players.length < 2
    ? 'Waiting for players'
    : matchState.lastMessage

  return (
    <main className="page">
      <section className="card">
        <h1>Lobby</h1>
        <p>Share this code: <strong id="invite-code-display">{matchState.guidCode}</strong></p>
        <p id="lobby-status">{lobbyStatus}</p>

        <ul className="list player-list">
          {matchState.players.map((player) => (
            <li key={player.playerId}>
              <span>{player.name}</span>
              <span>{player.isReady ? 'Ready' : 'Not ready'}</span>
            </li>
          ))}
        </ul>

        <button id="ready-btn" onClick={markReady} disabled={me?.isReady}>Ready</button>
      </section>
    </main>
  )
}
