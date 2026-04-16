import { useState } from 'react'
import { useGame } from '../context/GameContext'

export default function HomePage() {
  const { createMatch, joinMatch } = useGame()
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')

  return (
    <main className="page">
      <section className="card">
        <h1>Wheel of Speed</h1>
        <p>Boilerplate för lobby, rundor, SignalR och grundläggande spelstate.</p>

        <label>Namn</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ange namn" />

        <div className="actions">
          <button onClick={() => createMatch(name)} disabled={!name.trim()}>Create Game</button>
        </div>

        <hr />

        <label>Join via code</label>
        <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="GUID code" />

        <div className="actions">
          <button onClick={() => joinMatch(joinCode, name)} disabled={!name.trim() || !joinCode.trim()}>
            Join Game
          </button>
        </div>
      </section>
    </main>
  )
}
