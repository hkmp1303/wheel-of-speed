import { useState } from 'react'
import { useGame } from '../context/GameContext'
import Scoreboard from '../components/Scoreboard'

export default function MatchPage() {
  const { matchState, playerId, spin, guess, error } = useGame()
  const [guessText, setGuessText] = useState('')
  const myTurn = matchState.activePlayerId === playerId
  const hasSpun = matchState.currentWheelValue != null
  const isInProgress = matchState.status === 'InProgress'

  async function submitGuess(event) {
    event.preventDefault()
    await guess(guessText)
    setGuessText('')
  }

  return (
    <main className="page wide">
      <section className="card hero">
        <h1>Round {matchState.currentRound}/{matchState.maxRounds}</h1>
        <p>Current player: <strong>{matchState.activePlayerName ?? 'Waiting...'}</strong></p>
        <p>Timer: <strong>{matchState.secondsLeft}</strong></p>
        <p className="word">{matchState.maskedWord || '_ _ _ _'}</p>
        <p>{matchState.lastMessage}</p>

        {error && <p className="error">{error}</p>}

        <div className="actions">
          {matchState.status === 'RoundEnded' && (
            <p><em>Round ended — next round starting soon...</em></p>
          )}

          <button onClick={spin} disabled={!myTurn || !isInProgress || hasSpun}>
            Spin
          </button>
          <span>{matchState.currentWheelValue ? `+${matchState.currentWheelValue} points` : 'Spin to set points'}</span>
        </div>

        <form onSubmit={submitGuess} className="guess-form">
          <input
            value={guessText}
            onChange={(e) => setGuessText(e.target.value)}
            placeholder="Type your guess"
            disabled={!myTurn || !isInProgress || !hasSpun}
          />
          <button type="submit" disabled={!myTurn || !guessText.trim() || !hasSpun}>Guess</button>
        </form>

        {matchState.status === 'Finished' && (
          <div className="ending-box">
            <h2>Match complete</h2>
            <p>{matchState.lastMessage}</p>
          </div>
        )}
      </section>

      <Scoreboard players={matchState.players} />
    </main>
  )
}
