import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as signalR from '@microsoft/signalr'

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [playerName, setPlayerName] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [matchCode, setMatchCode] = useState('')
  const [matchState, setMatchState] = useState(null)
  const [connection, setConnection] = useState(null)
  const [error, setError] = useState('')

  const api = useMemo(() => ({
    async createMatch(name) {
      setError('')
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName: name })
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to create match.' }))
        setError(err.error || 'Failed to create match.')
        return null
      }
      const data = await response.json()
      const createdPlayer = data.players[0]
      setPlayerName(name)
      setPlayerId(createdPlayer.playerId)
      setMatchCode(data.guidCode)
      setMatchState(data)
      return data
    },
    async joinMatch(code, name) {
      setError('')
      const response = await fetch(`/api/matches/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: name })
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to join match.' }))
        setError(err.error || 'Failed to join match.')
        return null
      }
      const data = await response.json()
      const joinedPlayer = data.players.find((player) => player.name.toLowerCase() === name.toLowerCase())
      setPlayerName(name)
      setPlayerId(joinedPlayer?.playerId ?? '')
      setMatchCode(data.guidCode)
      setMatchState(data)
      return data
    },
    async markReady() {
      const response = await fetch(`/api/matches/${matchCode}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to mark ready.' }))
        setError(err.error || 'Failed to mark ready.')
        return
      }
      const data = await response.json()
      setMatchState(data)
    },
    async spin() {
      const response = await fetch(`/api/matches/${matchCode}/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to spin.' }))
        setError(err.error || 'Failed to spin.')
        return
      }
      const data = await response.json()
      setMatchState(data)
    },
    async guess(guess) {
      const response = await fetch(`/api/matches/${matchCode}/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, guess })
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to submit guess.' }))
        setError(err.error || 'Failed to submit guess.')
        return null
      }
      const data = await response.json()
      setMatchState(data)
      return data
    },
    async fetchMatch(code) {
      const response = await fetch(`/api/matches/${code}`)
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Match not found.' }))
        setError(err.error || 'Match not found.')
        return null
      }
      const data = await response.json()
      setMatchState(data)
      return data
    }
  }), [matchCode, playerId])

  useEffect(() => {
    if (!matchCode) return

    const hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/match')
      .withAutomaticReconnect()
      .build()

    hubConnection.on('matchUpdated', (state) => {
      setMatchState(state)
    })

    hubConnection.start()
      .then(() => hubConnection.invoke('JoinMatchGroup', matchCode))
      .catch(() => setError('Could not connect to realtime updates.'))

    setConnection(hubConnection)

    return () => {
      hubConnection.stop()
    }
  }, [matchCode])

  return (
    <GameContext.Provider value={{
      playerName,
      setPlayerName,
      playerId,
      matchCode,
      matchState,
      error,
      connection,
      ...api
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) throw new Error('useGame must be used inside GameProvider')
  return context
}
