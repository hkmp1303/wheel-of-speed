# Testing Plan

This plan reflects the current state of the project (server, frontend, and existing test assets) and the user stories in `user-stories.md`. It supersedes
`Testing/TESTING-PLAN.md`, which is retained as a historical baseline.

## Test Layers

- Unit tests (xUnit, `Testing/UnitTests/WheelOfSpeed.UnitTests`):
  - `MatchEngine` game-rule logic.
  - `InMemoryMatchService` orchestration, including SignalR client invocations
    via mocked `IHubContext<MatchHub>`.
  - `WordBankService` word/wheel-value generation.
- API tests (Postman/Newman, `Testing/ApiTests/wheel-of-speed.postman_collection.json`):
  - Contract and behavior checks for the minimal HTTP endpoints in
    `Server/Api/MatchEndpoints.cs`.
- E2E tests (Playwright, `frontend/tests`):
  - Critical user behavior through the UI across two browser contexts (host /
    guest), driven by both UI interactions and direct API calls where
    determinism is required.
- BDD feature specifications (`Testing/BDD/Features`, `Testing/e2e/ui/features`):
  - Gherkin descriptions of intended behavior for Rematch, Word Bank, and
    Prize Wheel. Treated as living documentation. Only Prize Wheel currently
    has step definitions (`Testing/e2e/ui/steps/prize-wheel.steps.js`); the
    other feature files are not yet wired to a runner. See
    [Open Decisions](#open-decisions).

## Story Coverage

Stories below are grouped by the feature areas defined in `user-stories.md`. Each
mapped item names the test that exercises it. Items marked **Gap** have no
test in any layer today.

### Feature Area 1 - Lobby and Match Setup

- Create match and lobby creation
  - Unit: `MatchEngineTests.CreateMatch_ShouldCreateLobbyWithOnePlayer`,
    `MatchEngineTests.CreateMatch_SetsInitialStateCorrectly`
  - API: `Create match`
  - E2E: `lobby-flow.spec.js > create and join lobby starts match when both players are ready`
- Join match by code
  - API: `Join match`
  - E2E: same test as above
- Duplicate name rejection
  - Unit: `MatchEngineTests.AddPlayer_*` (via `BuildReadyMatch` paths)
  - API: `Join match with duplicate player name is rejected`
- Invalid match code rejection
  - API: `Join match with invalid guid code is rejected`
- Add player after start is rejected
  - Unit: `MatchEngineTests.AddPlayer_WhenGameAlreadyStarted_DoesNotAddPlayer`
- Ready flow and auto-start
  - Unit: `MatchEngineTests.MarkReady_WhenAllPlayersReady_TransitionsStatusToInProgress`,
    `MatchEngineTests.StartNextRound_ShouldPickFirstPlayerAsActiveInRoundOne`
  - API: `Host marks ready`, `Guest marks ready and auto-starts match`
  - E2E: `lobby-flow.spec.js > create and join lobby starts match when both players are ready`
- Home page input gating and navigation
  - E2E: `lobby-flow.spec.js > rules link opens rules page and back returns home`,
    `home page buttons are disabled until required input exists`
- Difficulty selection in lobby
  - E2E: `difficulty buttons are visible on create lobby screen`,
    `selected difficulty is shown in lobby after create`
- Max-rounds validation (even, 4-16)
  - Unit: `InMemoryMatchServiceCreateMatchTests.CreateMatchAsync_*`

### Feature Area 2 - Core Round Flow

- Active player selection per round
  - Unit: `MatchEngineTests.StartNextRound_ShouldPickFirstPlayerAsActiveInRoundOne`,
    `MatchEngineTests.EndRound_ShouldSetActivePlayerForNextRound`
- Word is displayed as masked underscores at round start
  - E2E: `lobby-flow.spec.js > word is displayed as letter boxes when match starts`
- Round advances after end of round - **Gap**
  - Needed: Unit test `EndRound_ShouldAdvanceToNextRound_WhenNotFinalRound`
    verifying round counter increments, state transitions correctly, new
    word/timer set, active player assigned for next round
  - Needed: Unit test `EndRound_ShouldTransitionToFinished_WhenFinalRound`
    verifying MatchState becomes Finished, GameOverMessage is set, no
    further round starts
  - Needed: E2E test covering multi-round flow - UI shows round complete
    message, round counter updates, new masked word appears, active player
    indicator updates, scores preserved across rounds
  - Needed: E2E test for final round completion - final screen displays
    with winner, no new round starts, rematch/exit options appear
- Match ends automatically after the final round - **Gap**
  - Needed: direct unit test for `MatchEngine.FinishMatch` covering score
    preservation, `GameOverMessage`, full letter reveal, and throw on
    `Lobby` / `Finished` states.

### Feature Area 3 - Word Retrieval

- Word length per difficulty (Easy=4, Normal=6, Hard=8) and default = Normal
  - Unit: `WordBankServiceTests.GetRandomWord_*`
- Variety across repeated requests
  - Unit: `WordBankServiceTests.GetRandomWord_*_ShouldReturnVariedWords`
- BDD spec: `Testing/BDD/Features/WordBank.feature`

### Feature Area 4 - Turn Rules and Final Guess

- Only the active player can act
  - Unit: `MatchEngineTests.ApplyGuess_*` and spin guards
  - API: `Spin with non-active player is rejected`
- Spin required before guess
  - Unit: `MatchEngineTests.ApplyGuess_ShouldThrow_WhenWheelHasNotBeenSpun`
- Timer paused until player spins (`CurrentWheelValue is null`)
  - Implementation: `InMemoryMatchService.RunLoopAsync` checks
    `if (match.CurrentWheelValue is null) continue;` to pause timer, letter
    reveal, and prevent timeout rotation until the active player spins the wheel
  - Purpose: Distinguishes "waiting for initial spin" vs "player spun but time
    ran out" - prevents timer from expiring before player takes any action
  - Tested: Unit test `ApplyGuess_ShouldThrow_WhenWheelHasNotBeenSpun` verifies
    guess is blocked when wheel is null
  - **Gap**: No test verifying timer stays paused (doesn't decrement) when
    `CurrentWheelValue is null` in the server loop
- Final-guess mechanic (locked wheel value, 20s, multiple guesses)
  - Implementation: `RotateTurn` checks `hadWheelValue = match.CurrentWheelValue.HasValue`
    - If TRUE → creates final guess turn with locked wheel value, 20 seconds
    - If FALSE → normal turn rotation with 45 seconds, `CurrentWheelValue = null`
  - Unit: `MatchEngineTests.RotateTurn_ShouldCreateFinalGuessTurn_WhenWheelValueExists`,
    `RotateTurn_ShouldResetNormally_WhenNoWheelValue`,
    `ApplySpin_ShouldThrow_WhenFinalGuess`,
    `ApplyGuess_ShouldAllowMultipleGuesses_DuringFinalGuess`,
    `ApplyGuess_ShouldAwardPoints_WhenFinalGuessIsCorrect`,
    `EndRound_ShouldClearFinalGuessFlag`
  - E2E: `lobby-flow.spec.js > final guess keeps wheel value locked for opponent`
- Rotate-turn guard when round resolved
  - Unit: `MatchEngineTests.RotateTurn_ShouldThrow_WhenRoundIsAlreadyResolved`
- After incorrect guess spin is locked until timer rotates turn
  - E2E: `lobby-flow.spec.js > after incorrect guess spin is locked until timer rotates turn`

### Feature Area 5 - Prize Wheel

- Wheel renders with 5 slices and pointer indicator
  - E2E: `prize-wheel.spec.js > wheel renders with top pointer indicator`,
    `wheel has all 5 slices visible`
  - BDD: `Testing/e2e/ui/features/prize-wheel.feature`
- Spin reward generation matches frontend `[100, 200, 300, 400, 500]`
  - Unit: `MatchEngineSpinTests.GenerateSpinReward_*`,
    `ApplySpin_SetsCurrentWheelValueToValidValue`,
    `WordBankServiceTests.GetRandomWheelValue_*`
- Spin landing animation and post-landing text glow
  - E2E: `prize-wheel.spec.js > active player can spin wheel and see landing indicator`,
    `text glow appears after landing animation`
- Active player spin and guess flow
  - API: `Spin with active player`
  - E2E: `lobby-flow.spec.js > active player can spin wheel and guess word`

### Feature Area 6 - Timer and Letter Reveal

- Dynamic timer based on word length
  - Unit: `MatchEngineTests.StartNextRound_ShouldCalculateTimerBasedOnWordLength`
- First letter revealed on spin
  - Unit: `MatchEngineTests.ApplySpin_ShouldRevealFirstLetterImmediately`
- All letters revealed at round end
  - Unit: `MatchEngineTests.EndRound_ShouldRevealAllLetters`,
    `RevealAllLetters_ShouldRevealAllLettersInWord`
- Server-driven timer expiry rotates turn / ends round - **Implementation exists, but Gap in testing**
  - Implementation: `InMemoryMatchService.RunLoopAsync` runs a background loop
    that ticks every 1 second, decrements `SecondsLeft`, reveals letters
    progressively, and automatically calls `_engine.RotateTurn(match)` when
    `SecondsLeft == 0` (normal turn) or `_engine.EndRound`/`_engine.FinishMatch`
    (final guess timeout)
  - Tested: Unit tests exist for `RotateTurn` logic itself
    (`RotateTurn_ShouldCreateFinalGuessTurn_WhenWheelValueExists`,
    `RotateTurn_ShouldResetNormally_WhenNoWheelValue`)
  - **Gap**: No integration test that verifies the server loop (`RunLoopAsync`)
    actually calls `RotateTurn` or `EndRound` on timeout automatically
  - Needed: Integration test that starts the loop (or mocks its tick), waits
    for timer expiry, and verifies turn rotation happened without client action
- Live countdown and letter reveal in the UI - **Gap**
  - Needed: E2E assertion that the masked word updates and the countdown
    decrements during a turn.

### Feature Area 7 - Guessing System

- Correct guess awards wheel value to player
  - Unit: `MatchEngineTests.ApplyGuess_ShouldAwardPointsWhenGuessIsCorrect`
- Incorrect guess keeps match in progress and awards no score
  - API: `Incorrect guess keeps match in progress`
  - E2E: `lobby-flow.spec.js > after incorrect guess spin is locked until timer rotates turn`
- Correct-answer message and CSS styling
  - Unit: `MatchEngineTests.ApplyGuess_ShouldSetCorrectAnswerClassForCorrectAnswer`,
    `EndRound_ShouldPreserveCorrectAnswerMessageAndClass`,
    `StartNextRound_ShouldResetMessageClassToDefault`
- Guess input cleared after submission
  - E2E: `lobby-flow.spec.js > active player can spin wheel and guess word`
- Ignore guesses submitted after timeout - **Gap**
  - Needed: unit test asserting `ApplyGuess` is rejected (or no-ops) once the
    turn has rotated due to timeout.
- Correct-guess scoring at the API layer - **Gap**
  - Needed: Newman test that drives a known word and asserts the active
    player's score increments by the wheel value.

### Feature Area 8 - Scoring System

- Score is tracked per player and surfaced to both clients
  - E2E: `lobby-flow.spec.js > scoreboard updates with player scores after guess`
- Score increments by exact wheel value on correct guess
  - Unit: `MatchEngineTests.ApplyGuess_ShouldAwardPointsWhenGuessIsCorrect`,
    `ApplyGuess_ShouldAwardPoints_WhenFinalGuessIsCorrect`

### Feature Area 9 - Endgame and Rematch

- `FinishMatch` direct behavior - **Gap**
  - Needed: unit tests for `MatchEngine.FinishMatch` covering status
    transition, `GameOverMessage`, score preservation, full letter reveal,
    and rejection from `Lobby` / `Finished` source states.
- Final standings payload / winner display - **Gap**
  - Needed: API or E2E coverage for the end-of-match payload (winner,
    per-player final scores) and the result screen.
- Rematch (request / accept / decline / pending guard / fresh GUID)
  - Unit: `MatchEngineRematchTests.*` (guard, happy path, accept, decline)
  - Service: `InMemoryMatchServiceRematchTests.RequestRematchAsync_*`,
    `AcceptRematchAsync_*`, `DeclineRematchAsync_*`
  - E2E: `rematch-flow.spec.js > rematch button appears after game over`,
    `challenger can request rematch and opponent receives notification`,
    `opponent can accept rematch and navigate to new lobby`,
    `opponent can decline rematch`
  - BDD: `Testing/BDD/Features/Rematch.feature`
- Rematch edge cases from feature file not yet covered
  - **Gap**: challenger disconnect cancellation, second concurrent rematch
    attempt returns conflict, rematch on still-in-progress match rejected.
- "Exit" option after match end - **Gap**
- Player disconnect handling - **No implementation exists**
  - **Missing**: No `OnDisconnectedAsync` in `MatchHub` to handle when a player
    disconnects or leaves the game
  - **Missing**: No connection tracking to map SignalR `ConnectionId` to `playerId`
  - **Missing**: No player removal logic or `RemovePlayer` method in game engine
  - **Impact during match**: If active player disconnects, opponent is stuck
    forever waiting for their turn. Timer continues running but match is frozen.
  - **Impact during rematch**: If challenger disconnects after sending rematch
    request, `PendingRematchId` hangs forever with no cleanup or timeout
  - **Gap**: No tests for disconnect scenarios because no implementation exists
  - Needed: Implement disconnect handling in `MatchHub.OnDisconnectedAsync` to:
    1. Track connectionId → playerId mapping
    2. Detect which player/match the disconnected connection belongs to
    3. Notify remaining player via SignalR broadcast
    4. Cancel pending rematch if exists
    5. Optionally: end match with forfeit, pause state, or allow reconnection
  - Needed after implementation: Unit tests for disconnect logic, E2E tests
    simulating player disconnect during lobby/match/rematch phases

### Feature Area 10 - Real-Time (SignalR)

- `rematchChallenged` is broadcast to the original match group
  - Service: `InMemoryMatchServiceRematchTests.RequestRematchAsync_ShouldCreateRematchAndEmitChallengeEvent`
- All other broadcasts (lobby updates, turn changes, timer ticks, letter
  reveals, score updates, round status, `rematchAccepted`,
  `rematchDeclined`, `rematchCancelled`) - **Gap**
  - Service-level: Tests mock `IHubContext` for create, join, ready, but do not
    assert individual SignalR events
  - Needed: Service-level tests that verify the corresponding `SendCoreAsync`
    invocations on a mocked `IClientProxy`, mirroring the existing rematch pattern
- End-to-end SignalR connection over a real hub - **Gap**
  - **Playwright supports WebSocket testing** via `page.on('websocket')` API:
    - Can listen to WebSocket connections and frames (`framereceived`/`framesent`)
    - Can intercept and mock WebSocket responses
    - Can verify SignalR hub messages are sent/received correctly
    - Can test multi-player scenarios with multiple browser contexts
  - Needed: E2E tests using Playwright WebSocket API to verify:
    - `LobbyUpdated` broadcast when player joins or marks ready
    - `MatchUpdated` broadcast when player spins wheel or guesses
    - `TurnChanged` broadcast when turn rotates
    - `TimerTick` broadcast during countdown
    - `RoundEnded` broadcast when round completes
    - `MatchFinished` broadcast when match ends
    - `rematchAccepted` / `rematchDeclined` / `rematchCancelled` broadcasts
    - Both players receive broadcasts simultaneously in real-time
- Connection lifecycle (connect, disconnect, reconnect) - **Gap**
  - Playwright can test WebSocket connection events (`close`, `open`)
  - Needed: E2E test for SignalR connection establishment on page load
  - Needed: E2E test for handling connection failures/reconnection
  - Needed: Integration test of hub connect/disconnect callbacks (once
    implemented - see Feature Area 9 disconnect gap)

## Negative and Edge Cases

The following are not currently covered and should be added at the layer
indicated:

- API: spin while match is `Lobby`, `RoundEnded`, or `Finished`.
- API: guess when `currentWheelValue` is `null` (expects 400).
- API: join when match is full / `InProgress` / `Finished`.
- API: mark ready for unknown `playerId`.
- API: rematch endpoints with invalid guid, double request (409), and
  request against a non-finished match.
- Unit: empty / whitespace `hostName`, `playerName`, `guess` already throw
  `ArgumentException` via `ValidateNotEmpty`; add explicit tests asserting
  this for each public entry point.

## Frontend Component Tests

There are currently no Vitest/Jest tests for `frontend/src`. Candidates for
unit-level coverage:

- `context/GameContext.jsx` (state reducer paths, SignalR event handlers).
- `components/PrizeWheel.jsx` (slice rendering, `data-landed`, glow timing).
- `components/Scoreboard.jsx` (sorting and active-turn highlight).
- `utils/messageFormatter.js` (pure function, easy to test).

## Run Commands

Backend unit tests (from repository root):

```powershell
dotnet test wheel-of-speed.sln
```

Or just the unit-test project:

```powershell
dotnet test "Testing/UnitTests/WheelOfSpeed.UnitTests/WheelOfSpeed.UnitTests.csproj"
```

Frontend tests (from `frontend/`):

```powershell
npm run test:api
npm run test:e2e
```

## CI Behavior

Current CI runs:

- Backend restore / build / test.
- Frontend install / build.
- Newman API tests against a started backend server.
- Playwright critical E2E tests with test artifact upload.

Not yet in CI:

- BDD feature execution (pending decision below).
- Frontend component tests (none exist yet).
- A real-hub SignalR smoke test.

## Open Decisions

1. **BDD layer.** `Testing/BDD/Features/Rematch.feature` and `WordBank.feature`
   have no step definitions and are not executed by any runner. Either wire
   them to a runner (e.g., Reqnroll for .NET, or `@cucumber/cucumber` against
   the existing Playwright fixtures, matching the prize-wheel pattern under
   `Testing/e2e/ui/steps`) or remove them. Until decided they serve as
   specification only.
2. **Stray file.** `Testing/InMemoryMatchServiceTests.cs` sits at the root of
   `Testing/` and is not part of any test project. Move it into
   `Testing/UnitTests/WheelOfSpeed.UnitTests` or delete it.
3. **Real-time test scope.** Decide whether SignalR broadcasts are validated
   only via mocked `IClientProxy` (current approach) or also via at least one
   hosted hub connection test.

## Status of the items cited in the original plan:

- "API test for correct-guess scoring" - **still a gap** (see Feature Area 7).
- "Unit test for `FinishMatch` after last round resolves" - **still a gap**
  (see Feature Area 2 / Feature Area 9). `FinishMatch` is exercised indirectly by rematch
  setup but has no direct assertions.
- "Unit test for `RotateTurn` on timer expiry" - **done**
  (`RotateTurn_ShouldCreateFinalGuessTurn_WhenWheelValueExists`,
  `RotateTurn_ShouldResetNormally_WhenNoWheelValue`,
  `RotateTurn_ShouldThrow_WhenRoundIsAlreadyResolved`).
