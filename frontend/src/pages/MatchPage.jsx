import React, { useState, useContext } from 'react'
import { useGame } from '../context/GameContext'
import Scoreboard from '../components/Scoreboard'
import PrizeWheel from '../components/PrizeWheel'

export default function MatchPage() {
  const { matchState, playerId, connection, matchCode, guess, error } = useGame()
  const [guessText, setGuessText] = useState('')
  const [spinPending, setSpinPending] = useState(false)
  const [guessDisabled, setGuessDisabled] = useState(false)
  const myTurn = matchState.activePlayerId === playerId
  const hasSpun = matchState.currentWheelValue != null
  const isInProgress = matchState.status === 'InProgress'
  const isRoundEnded = matchState.status === 'RoundEnded'
  const isFinalGuess = matchState.isFinalGuess || false

  function handleSpinStart() {
    setSpinPending(true)
    setGuessDisabled(true)
  }

  function handleSpinComplete(result) {
    setSpinPending(false)
    setGuessDisabled(false)
  }

  async function handleSpinButton() {
    if (!connection) return
    if (connection.state !== 'Connected') {
      console.error('Cannot spin: SignalR not connected (state=', connection.state, ')')
      return
    }
    try {
      handleSpinStart()
      // pass playerId explicitly (server hub requires it)
      const result = await connection.invoke('RequestSpin', matchCode, playerId)
      // server broadcasts matchUpdated which will update matchState; show reward briefly
      handleSpinComplete(result?.currentWheelValue ?? result?.rewardAmount ?? null)
    } catch (err) {
      console.error('Spin via hub failed', err)
      handleSpinComplete(null)
    }
  }

  async function submitGuess(event) {
    event.preventDefault()
    await guess(guessText)
    setGuessText('')
  }

  return (
    <main className="page wide">
      <section className="card hero">
        <h1>Round {matchState.currentRound}/{matchState.maxRounds}</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p>Current player: <strong>{matchState.activePlayerName ?? 'Waiting...'}</strong></p>
          <div className="timer" style={{ marginLeft: '1rem', textAlign: 'right' }}>
            <p>Timer: <strong>{matchState.secondsLeft}</strong></p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          <PrizeWheel spinPending={spinPending} reward={matchState.currentWheelValue} />
          <div style={{ flex: 1 }}>
            <p className="word">{matchState.maskedWord || '_ _ _ _'}</p>
            <p>{matchState.lastMessage}</p>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        {/* Game Status Message */}
        <div style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
          {isRoundEnded && (
            <p><em>Round ended. {myTurn ? 'Spin to start the next round.' : 'Waiting for next player to spin.'}</em></p>
          )}
          {isFinalGuess && myTurn && (
            <p><em style={{ color: '#ff6b35' }}>⚠️ Final Guess! The wheel value is locked. Make your guess!</em></p>
          )}
          {!isRoundEnded && !isFinalGuess && hasSpun && (
            <p><em>Wheel Value: +{matchState.currentWheelValue} points</em></p>
          )}
          {!isRoundEnded && !isFinalGuess && !hasSpun && myTurn && (
            <p><em>Spin the wheel to lock in your reward and reveal the first letter.</em></p>
          )}
        </div>

        <div className="actions">
          <button onClick={handleSpinButton} disabled={!myTurn || (!isInProgress && !isRoundEnded) || (isInProgress && hasSpun) || isFinalGuess}>
            Spin
          </button>
        </div>

        <form onSubmit={submitGuess} className="guess-form">
          <input
            value={guessText}
            onChange={(e) => setGuessText(e.target.value)}
            placeholder="Type your guess"
            disabled={!myTurn || !isInProgress || !hasSpun || guessDisabled}
          />
          <button type="submit" disabled={!myTurn || !guessText.trim() || !hasSpun || guessDisabled}>Guess</button>
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
