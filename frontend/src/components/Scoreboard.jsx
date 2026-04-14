export default function Scoreboard({ players }) {
  return (
    <section className="card">
      <h2>Scoreboard</h2>
      <ul className="list">
        {players.map((player) => (
          <li key={player.playerId}>
            <span>{player.name}{player.isActiveTurn ? ' ⭐' : ''}</span>
            <strong>{player.score} pts</strong>
          </li>
        ))}
      </ul>
    </section>
  )
}
