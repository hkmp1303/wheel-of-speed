# Testing Plan (Current Boilerplate Scope)

This plan covers functionality that already exists in the current boilerplate.

## Test Layers

- Unit tests (xUnit): Game rule logic in the match engine.
- API tests (Postman/Newman): Contract and behavior checks for minimal API endpoints.
- E2E tests (Playwright): Critical user behavior through UI.

## Story Coverage (Current State)

### Lobby and setup

- Create match and lobby creation
  - Unit: `CreateMatch_ShouldCreateLobbyWithOnePlayer`
  - API: `Create match`
  - E2E: `create and join lobby starts match when both players are ready`
- Join match by code
  - API: `Join match`
  - E2E: `create and join lobby starts match when both players are ready`
- Ready flow and auto-start on all ready
  - Unit: `StartNextRound_ShouldPickFirstPlayerAsActiveInRoundOne`
  - API: `Host marks ready`, `Guest marks ready and auto-starts match`
  - E2E: `create and join lobby starts match when both players are ready`

### Turn rules and guessing baseline

- Only active player can act
  - Unit: `ApplySpin_ShouldThrow_WhenPlayerIsNotActive`
  - API: `Spin with non-active player is rejected`
- Spin required before guess
  - Unit: `ApplyGuess_ShouldThrow_WhenWheelHasNotBeenSpun`
- Incorrect guess does not award score
  - API: `Incorrect guess keeps match in progress`

### Validation and error handling

- Duplicate player names are rejected
  - Unit: `AddPlayer_ShouldThrow_WhenNameAlreadyExists`
  - API: `Join match with duplicate player name is rejected`
- Invalid match code is rejected
  - API: `Join match with invalid guid code is rejected`

### Game mechanics and scoring

- Active player can spin wheel
  - E2E: `active player can spin wheel and guess word`
- Spin wheel produces point value
  - E2E: `active player can spin wheel and guess word`
- Active player can submit guess after spin
  - E2E: `active player can spin wheel and guess word`
- Scoreboard updates reflect player scores after guess
  - E2E: `scoreboard updates with player scores after guess`

## Run Commands

Run from `frontend` directory:

```powershell
npm run test:api
npm run test:e2e
```

Run unit tests from repository root:

```powershell
dotnet test "Testing/UnitTests/WheelOfSpeed.UnitTests/WheelOfSpeed.UnitTests.csproj"
```

## CI Behavior

Current CI now runs:

- Backend restore/build/test
- Frontend install/build
- Newman API tests against a started backend server
- Playwright critical E2E tests with test artifact upload

## Next Expansion (After Current Baseline)

- Add E2E for round transition and finished-state visibility.
