import { useState } from 'react'
import CreateLobbyForm from '../components/lobby/CreateLobbyForm'
import JoinLobbyForm from '../components/lobby/JoinLobbyForm'
import { useGame } from '../context/GameContext'

export default function HomePage() {
  const { createMatch, joinMatch, error } = useGame()
  const [view, setView] = useState('menu')
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [difficulty, setDifficulty] = useState('Medium')

  return (
    <main className="page">
      <section className="card">
        <h1>Wheel of Speed</h1>
        <p>Guess the word, simple as that.</p>

        {view === 'menu' && (
          <div className="actions">
            <button onClick={() => setView('create')}>Create Lobby</button>
            <button onClick={() => setView('join')}>Join Lobby</button>
          </div>
        )}

        {view === 'create' && (
          <CreateLobbyForm
            name={name}
            difficulty={difficulty}
            onNameChange={setName}
            onDifficultyChange={setDifficulty}
            onSubmit={() => createMatch(name.trim(), difficulty)}
            onBack={() => setView('menu')}
          />
        )}

        {view === 'join' && (
          <JoinLobbyForm
            name={name}
            joinCode={joinCode}
            onNameChange={setName}
            onJoinCodeChange={(value) => setJoinCode(value.replace(/\s+/g, '').toUpperCase())}
            onSubmit={() => joinMatch(joinCode.trim(), name.trim())}
            onBack={() => setView('menu')}
          />
        )}

        {error && <p className="error">{error}</p>}
      </section>
    </main>
  )
}
