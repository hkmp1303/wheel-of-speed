import { useState } from 'react'
import CreateLobbyForm from '../components/lobby/CreateLobbyForm'
import JoinLobbyForm from '../components/lobby/JoinLobbyForm'
import { useGame } from '../context/GameContext'

export default function HomePage() {
  const { createMatch, joinMatch } = useGame()
  const [view, setView] = useState('menu')
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')

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
            onNameChange={setName}
            onSubmit={() => createMatch(name)}
            onBack={() => setView('menu')}
          />
        )}

        {view === 'join' && (
          <JoinLobbyForm
            name={name}
            joinCode={joinCode}
            onNameChange={setName}
            onJoinCodeChange={(value) => setJoinCode(value.toUpperCase())}
            onSubmit={() => joinMatch(joinCode, name)}
            onBack={() => setView('menu')}
          />
        )}
      </section>
    </main>
  )
}
