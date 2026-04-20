# Changelog

## [Unreleased] - Final Guess Mechanic & Letter Reveal System

- 2026-04-19

### **Implementation Summary**

**Complete Game Flow:**
1. **Player A's Turn:**
   - Spins wheel → 1st letter reveals immediately, timer starts
   - Letters reveal progressively: 2nd @ 5s, 3rd @ 10s, then 8s intervals
   - Final two reveals (3rd-to-last and 2nd-to-last) use slower 10s intervals for tension buildup
   - Turn automatically ends when only 1 letter remains unrevealed

2. **Final Guess Period:**
   - Player B gets 20 seconds with locked wheel value from Player A's spin
   - Can make unlimited guesses during the 20-second period
   - No spin allowed, no additional letters revealed during guessing
   - Correct guess → Player B wins the locked points, round ends, **full word revealed**
   - Timer expires → Round ends, **full word revealed**, nobody gets points

3. **Post-Round Word Display:**
   - **Full word remains visible** after round ends
   - **No automatic round start** - word stays visible until next player spins
   - Next player spinning the wheel triggers the new round to begin
   - Creates natural pacing and ensures players see the answer

**Example Timeline (7-letter word "REACTOR"):**
- 0s: Player A spins + R______ (1st letter) | 5s: RE_____ (2nd) | 10s: REA____ (3rd)
- 18s: REAC___ (4th, +8s) | 28s: REACT__ (5th, +10s) | 38s: REACTO_ (6th, +10s)
- 38s: **Turn rotates** → Final guess begins with last letter hidden
- 38-58s: Player B has 20 seconds to guess "REACTOR" with unlimited attempts
- 58s: Timer expires → **Full word "REACTOR" revealed** to both players
- Word stays visible until Player A spins the wheel (starting next round)

---

### **Feature: Progressive Letter Reveal System**
  - Implemented sophisticated letter reveal timing with special intervals for final letters
  - **Dynamic timer calculation based on word length:**
    - Timer is calculated to accommodate all letter reveals plus 10-second buffer
    - Formula: Time to reveal 2nd-to-last letter + 10 seconds
    - Example for 7-letter word: 38s (last reveal) + 10s buffer = 48s total
    - Example for 5-letter word: 20s (last reveal) + 10s buffer = 30s total
    - Player has 10 seconds to guess after 2nd-to-last letter revealed
  - **Reveal schedule:**
    - **Immediately on spin**: 1st letter revealed
    - **After 5 seconds**: 2nd letter revealed
    - **After 10 seconds**: 3rd letter revealed
    - **Every 8 seconds** (default): 4th and subsequent letters revealed
    - **Every 10 seconds**: 3rd-to-last and 2nd-to-last letters (special slower reveal for dramatic effect)
    - **Stops at last letter**: Revealing stops when only 1 letter remains unrevealed
  - **Backend changes:**
    - Added `ElapsedSecondsSinceSpin` to track time since wheel spin
    - Added `LetterRevealIntervalSeconds` property (default: 8 seconds) for configurable reveal timing
    - Added `CalculateTimerForWord` method to dynamically calculate timer based on word length
    - `StartNextRound` now calculates timer instead of using fixed 45 seconds
    - `ApplySpin` now reveals first letter immediately and resets elapsed time
    - Game loop (`InMemoryMatchService.RunLoopAsync`) implements precise reveal timing:
      - Exact timing at 5s and 10s for 2nd and 3rd letters
      - Cumulative calculation for subsequent letters with variable intervals
      - Special 10-second intervals for 3rd-to-last and 2nd-to-last letters
    - **Removed immediate turn rotation** when 1 letter remains - player now gets 10s buffer to guess
  - **Turn ending logic:**
    - Active player's turn continues for 10 seconds after 2nd-to-last letter revealed
    - Turn rotates to final guess only when timer expires (not immediately when 2nd-to-last revealed)
    - Opponent gets final guess with all revealed letters except one
    - No additional letters revealed during final guess period

### **Feature: Final Guess Mechanic**
  - When an active player's turn ends (timer expires or all but one letter revealed) without a correct guess, the next player gets a "final guess" opportunity with the locked wheel value.
  - **Multiple guesses allowed:** Opponent can make unlimited guesses during the 20-second final guess period (FIXED: previously ended on first incorrect guess)
  - **Backend changes:**
    - Added `IsFinalGuess` property to `MatchState` and `MatchStateDto` models
    - `RotateTurn` method now checks if previous turn had a wheel value:
      - If yes and not already final guess: creates final guess turn with 20-second timer and locked wheel value
      - If no or already final guess: normal rotation (45 seconds, cleared wheel value)
    - `ApplySpin` method prevents spinning during final guess turns and reveals first letter immediately
    - `ApplyGuess` method allows multiple incorrect guesses during final guess period
      - Incorrect guess during final guess: "Incorrect guess. Try again!" (does NOT end round)
      - Incorrect guess during normal turn: "Incorrect guess. Keep going."
    - Only correct guess or timer expiry ends the final guess period
    - Game loop ends round when final guess timer expires (no points awarded)
    - **Word reveal on round end:**
      - Added `RevealAllLetters` method to reveal all letters in the word
      - `EndRound` automatically reveals all letters so players can see the complete word
      - `EndRound` sets active player to whoever will start the NEXT round (based on round number rotation)
      - Uses same logic as `StartNextRound`: `ActivePlayerIndex = (nextRoundNumber - 1) % Players.Count`
      - `EndRound` clears `IsFinalGuess` flag to enable spin button for next round
      - `FinishMatch` also reveals all letters and clears `IsFinalGuess` when match ends
      - **Word remains visible indefinitely** until next player spins the wheel
    - **Round advancement changes:**
      - Removed automatic 3-second delay and round start after round ends
      - `SpinAsync` now checks if round has ended and starts next round before applying spin
      - `GuessAsync` no longer auto-advances after 3 seconds - word stays visible
      - Next round only begins when the next player spins the wheel
      - Creates natural pacing and ensures players see what the word was
  - **Frontend changes:**
    - Added visual indicator when player has final guess: "⚠️ Final Guess! The wheel value is locked."
    - Spin button disabled during final guess turns (`isFinalGuess` condition added)
    - `isFinalGuess` state exposed from match context to frontend
    - **Spin button enabled after round ends:** Added logic to allow spinning when `status === 'RoundEnded'`
    - Updated spin button disabled condition: `!myTurn || (!isInProgress && !isRoundEnded) || (isInProgress && hasSpun) || isFinalGuess`
    - Updated message when round ended: "Round ended — spin to start the next round."
    - Updated spin button helper text: "Spin to lock in the reward and start the round."
  - **Unit tests:**
    - Added `ApplySpin_ShouldRevealFirstLetterImmediately` test
    - Added `ApplyGuess_ShouldAllowMultipleGuesses_DuringFinalGuess` test (verifies multiple incorrect guesses don't end round)
    - Added `ApplySpin_ShouldThrow_WhenFinalGuess` test (verifies spin prevention)
    - Added `ApplyGuess_ShouldAwardPoints_WhenFinalGuessIsCorrect` test
    - Added `EndRound_ShouldRevealAllLetters` test (verifies all letters revealed on round end)
    - Added `EndRound_ShouldSetActivePlayerForNextRound` test (verifies active player is set correctly for next round)
    - Added `EndRound_ShouldClearFinalGuessFlag` test (verifies IsFinalGuess is cleared on round end)
    - Added `RevealAllLetters_ShouldRevealAllLettersInWord` test
    - Added `StartNextRound_ShouldCalculateTimerBasedOnWordLength` test (verifies dynamic timer calculation)
    - Updated `RotateTurn_ShouldCreateFinalGuessTurn_WhenWheelValueExists` and `RotateTurn_ShouldResetNormally_WhenNoWheelValue` tests

## [Previous] - Prize Wheel updates

- 2026-04-19
- Fix: MatchHub DI & SignalR stability
  - MatchHub constructor now depends on DI-registered interfaces (`IMatchService`, `IMatchEngine`) so SignalR can activate the hub correctly. This resolves SignalR connection errors that were closing client connections during OnConnectedAsync.

- Hub API change: server RequestSpin signature
  - `RequestSpin` now accepts an explicit `playerId` argument and validates that the caller is the active player for the match. Frontend updated to pass `playerId` when invoking the hub.

- Frontend updates
  - `MatchPage.jsx`: updated the SignalR invoke to `connection.invoke('RequestSpin', matchCode, playerId)` so the server receives the caller identity.
  - `GameContext.jsx`: fixed hub URL query construction and adjusted SignalR connection lifecycle handling.
  - `LobbyPage.jsx`: Ready button behavior corrected (no longer incorrectly blocked by connection state). Ready still posts to the API and the server broadcasts match updates via SignalR.

- Server CORS and preflight handling
  - Added a small middleware in `Program.cs` to ensure `Access-Control-*` headers are present on all responses (including error responses) and to short-circuit OPTIONS preflight with 204. The app still registers a permissive CORS policy for development.

- Game loop behavior
  - The server-side game loop was adjusted so the round countdown and automatic letter reveals do not start until the wheel has been spun for the active player. This prevents the timer/reveal from progressing before points are set.

- Build and verification
  - Corrected hub constructor signatures; server builds successfully in CI/dev after these changes.

Notes / next steps
- Add integration tests that exercise SignalR `RequestSpin` + match broadcasts and validate authorization (active player only).
- Add E2E tests for final guess mechanic to validate timer reset, spin prevention, and round ending
- Consider tightening CORS policy before production (restrict origins instead of echoing Origin).
- Optionally wire SignalR authentication so `Context.UserIdentifier` is populated and the hub can rely on it instead of requiring explicit `playerId` in every call.
