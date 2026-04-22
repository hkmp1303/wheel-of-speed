import React, { useState, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import Scoreboard from '../components/Scoreboard'
import PrizeWheel from '../components/PrizeWheel'

/**
 * Message processor - Generates context and player-specific messages
 * Handles styling, auto-clear timers, and message hierarchy
 */
function useMessageProcessor(matchState, playerId, activePlayerName) {
  const myTurn = matchState.activePlayerId === playerId
  const hasSpun = matchState.currentWheelValue != null
  const isRoundEnded = matchState.status === 'RoundEnded'
  const isFinalGuess = matchState.isFinalGuess || false
  const isLastRound = matchState.currentRound === matchState.maxRounds

  const [displayMessage, setDisplayMessage] = useState(null)
  const [displayMessageClass, setDisplayMessageClass] = useState(null)

  // Process and display messages based on context and player role
  useEffect(() => {
    // Check if this is a "Round X started" message
    const isRoundStartMessage = matchState?.lastMessage?.startsWith('Round ') && matchState?.lastMessage?.includes('started')

    // Determine if this is an incorrect guess message
    const isIncorrectGuess =
      matchState?.lastMessage === "Incorrect guess. Try again!" ||
      matchState?.lastMessage === "Incorrect guess. Keep going."

    // Determine message type and generate context/player-specific display
    let message = null
    let messageClass = null
    let autoClearMs = null

    if (isRoundStartMessage) {
      // Round start messages - show for both players, keep visible until spin
      message = matchState.lastMessage
      messageClass = null
    } else if (isIncorrectGuess) {
      // Generate targeted message based on player role
      if (myTurn) {
        message = "Incorrect guess. Try again!"
        messageClass = "incorrect-guess-active"
      } else {
        const guessedWord = matchState.lastGuessedWord || 'unknown'
        message = `${activePlayerName} guessed incorrectly: ${guessedWord}.`
        messageClass = "incorrect-guess-opponent"
      }
      autoClearMs = 3000 // Auto-clear after 3 seconds
    } else if (matchState?.lastMessageClass === 'correct-answer') {
      // For correct answers, keep displayed
      message = matchState.lastMessage
      messageClass = matchState.lastMessageClass
    } else if (isFinalGuess && myTurn) {
      // Final guess warning - context-specific message
      message = "⚠ Final Guess! The wheel value is locked. Make your guess!"
      messageClass = "final-guess-warning"
    } else if (isFinalGuess && !myTurn) {
      // Opponent's final guess - show active player what's happening
      message = `${activePlayerName} has a final guess with the locked wheel value.`
      messageClass = null
    } else if (!isRoundEnded && !isFinalGuess && !hasSpun && myTurn && !isLastRound) {
      // Spin instruction - context-specific, only on non-final rounds
      message = "Spin the wheel to lock in your reward and reveal the first letter."
      messageClass = null
    }

    setDisplayMessage(message)
    setDisplayMessageClass(messageClass)

    // Set up auto-clear timer if needed
    if (autoClearMs) {
      const timer = setTimeout(() => {
        setDisplayMessage(null)
        setDisplayMessageClass(null)
      }, autoClearMs)
      return () => clearTimeout(timer)
    }
  }, [
    matchState?.lastMessage,
    matchState?.lastMessageClass,
    matchState?.lastGuessedWord,
    matchState?.currentRound,
    matchState?.maxRounds,
    myTurn,
    activePlayerName,
    hasSpun,
    isRoundEnded,
    isFinalGuess,
    isLastRound
  ])

  return { displayMessage, displayMessageClass }
}

export default function MatchPage() {
  const { matchState, playerId, connection, matchCode, guess, error, rematchState, requestRematch, acceptRematch, declineRematch, fetchMatch } = useGame()
  const [guessText, setGuessText] = useState('')
  const [spinPending, setSpinPending] = useState(false)
  const [guessDisabled, setGuessDisabled] = useState(false)
  const [rematchPending, setRematchPending] = useState(false)

  const myTurn = matchState.activePlayerId === playerId
  const activePlayerName = matchState.activePlayerName ?? 'Opponent'
  const hasSpun = matchState.currentWheelValue != null
  const isInProgress = matchState.status === 'InProgress'
  const isRoundEnded = matchState.status === 'RoundEnded'
  const isFinalGuess = matchState.isFinalGuess || false

  // Use unified message processor
  const { displayMessage, displayMessageClass } = useMessageProcessor(matchState, playerId, activePlayerName)



  function handleSpinStart() {
    setSpinPending(true)
    setGuessDisabled(true)
    // Message will be cleared by useMessageProcessor when spin completes and state updates
  }

  function handleSpinComplete(wheelReward) {
    setSpinPending(false)
    setGuessDisabled(false)
    // Message will be displayed from matchState via the useEffect when server broadcasts
  }

  function handleWheelAnimationComplete(reward) {
    // Animation complete, but spinPending will be cleared when server broadcasts matchUpdated
    console.log(`Wheel animation complete for reward: ${reward}`)
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

  async function handleRequestRematch() {
    setRematchPending(true)
    const result = await requestRematch()
    if (result) {
      // Stay on this page; wait for opponent response
    } else {
      setRematchPending(false)
    }
  }

  async function handleAcceptRematch() {
    const result = await acceptRematch()
    if (result && result.rematchGuidCode) {
      await fetchMatch(result.rematchGuidCode)
    }
  }

  async function handleDeclineRematch() {
    await declineRematch()
    setRematchPending(false)
  }

  return (
    <main id="game-board" className="page wide">
      <section className="card hero">
        <h1>Round {matchState.currentRound}/{matchState.maxRounds}</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p>Current player: <strong>{matchState.activePlayerName ?? 'Waiting...'}</strong></p>
          <div className="timer" style={{ marginLeft: '1rem', textAlign: 'right' }}>
            <p>Timer: <strong>{matchState.secondsLeft}</strong></p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          <PrizeWheel
            spinPending={spinPending}
            reward={matchState.currentWheelValue}
            onSpinComplete={handleWheelAnimationComplete}
          />
          <div className="word-display">
            {matchState.maskedWord
            ? matchState.maskedWord.split(' ').map((char, i) => (
                <span key={i} className="letter-box">
                  {char === '_' ? '' : char}
                </span>
              ))
            : Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className="letter-box"></span>
            ))
          }
          </div>
        </div>
        {error && <p className="error">{error}</p>}

        <div className="actions">
          <button onClick={handleSpinButton} disabled={!myTurn || (!isInProgress && !isRoundEnded) || (isInProgress && hasSpun) || isFinalGuess}>
            Spin
          </button>
        </div>

        {/* Unified Message System - Context and player-specific messages */}
        <div className="messages">
          {displayMessage && (
            <p><em className={displayMessageClass}>{displayMessage}</em></p>
          )}
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
            <p>{matchState.gameOverMessage}</p>

            {rematchState && rematchState.status === 'challenged' && rematchState.responderPlayerId === playerId && (
              <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '4px' }}>
                <h3>Rematch Challenge Received</h3>
                <p>Your opponent has challenged you to a rematch!</p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center'}}>
                  <button onClick={handleAcceptRematch} className="accept-button">Accept</button>
                  <button onClick={handleDeclineRematch} className="decline-button">Decline</button>
                </div>
              </div>
            )}

            {rematchState && rematchState.status === 'challenged' && rematchState.challengerPlayerId === playerId && (
              <p style={{ marginTop: '1rem', fontStyle: 'italic', color: '#666' }}>Waiting for opponent to accept...</p>
            )}

            {!rematchState && (
              <button onClick={handleRequestRematch} disabled={rematchPending} className="rematch-button" style={{ marginTop: '1rem' }}>
                {rematchPending ? "Requesting Rematch..." : "Request Rematch"}
              </button>
            )}

            {rematchState && rematchState.status === 'declined' && (
              <p style={{ marginTop: '1rem', color: '#e74c3c' }}>Rematch was declined</p>
            )}
          </div>
        )}
      </section>

      <Scoreboard players={matchState.players} />
    </main>
  )
}