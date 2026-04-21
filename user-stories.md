# User Stories – Wheel of Speed MVP

## 1. Setup & Lobby

### Backend

- As a player, I want to create a new match so that I can invite others to play.
- As the system, I want to generate a unique GUID for each match so that each lobby can be uniquely identified.
- As a player, I want to join a match via its GUID so that I can participate in the same game as others.
- As the system, I want to save players by name in the match so that the lobby can track who has joined.
- As a player, I want to mark myself as ready so that the game can know when I am prepared to start.
- As the system, I want to verify that all players are ready so that the match only starts when everyone is prepared.
- As the system, I want to automatically start the match when at least two players are ready so that gameplay can begin without manual intervention.

### Frontend

- As a player, I want a start view where I can enter my name so that I can identify myself in the game.
- As a player, I want a “Create Game” button so that I can quickly start a new match.
- As a player, I want to join a game via a shared link so that entering existing matches is simple.
- As a player, I want to see the lobby player list so that I know who has joined.
- As a player, I want to see each player’s ready status so that I know when the game is close to starting.
- As a player, I want a “Ready” button so that I can confirm I am prepared.
- As a player, I want to see the GUID/shareable link so that I can invite others.

---

## 2. Match & Rounds

### Backend

- As the system, I want to maintain match state including the current round so that game progression is tracked correctly.
- As the system, I want the game to run for a maximum of three rounds so that the match has a clear structure.
- As the system, I want to track the active player so that only one player acts at a time.
- As the system, I want a function to move to the next round so that the game progresses correctly.
- As the system, I want the match to end automatically after round three so that results can be shown.

### Frontend

- As a player, I want to see the current round number so that I know how far the game has progressed.
- As a player, I want to see whose turn it is so that I know when I can act.
- As a player, I want the UI to update between rounds so that the game feels clear and responsive.

---

## 3. Word Retrieval

### Backend

- As the system, I want a word bank so that words can be selected for each round.
- As the system, I want to fetch a random word so that each round is unpredictable.
- As the system, I want the same word to be used for all players within a round so that gameplay is fair.

### Frontend

- As a player, I want the hidden word to be shown as underscores so that I can see how many letters it contains.
- As a player, I want the number of letter boxes to adapt dynamically to the word length so that the UI matches the current word.

---

## 4. Turn-Based Gameplay

### Backend

- As the system, I want to manage turn order so that players act one at a time in sequence.
- As the system, I want turns to rotate automatically when time runs out so that the game continues smoothly.
- As the system, I want only the active player to be allowed to guess so that the rules are enforced fairly.

### Frontend

- As a player, I want the active player to be clearly highlighted so that everyone knows whose turn it is.
- As a non-active player, I want my input disabled so that I cannot guess when it is not my turn.
- As a player, I want to see when the turn changes so that I can follow the game flow.

---

## 5. Wheel (Basic Score Wheel)

### Backend

- As the system, I want a fixed list of point values so that each spin can award a defined score.
- As the system, I want to randomly select a wheel value so that the spin result is unpredictable.
- As the system, I want to store the wheel value for the current turn so that correct guesses can award the right points.

### Frontend

- As a player, I want a simple “Spin” button so that I can trigger the wheel before guessing.
- As a player, I want to see the spin result so that I know what my guess is worth.

---

## 6. Timer & Reveal

### Backend

- As the system, I want a 45-second timer for each turn so that guesses must happen within a limited time.
- As the system, I want to reveal one letter at a time so that the word becomes easier over time.
- As the system, I want letters to be revealed in random order so that the reveal mechanic feels dynamic.
- As the system, I want the reveal process to stop when the word is guessed correctly so that unnecessary updates do not continue.
- As the system, I want the turn to change automatically when the timer reaches zero so that the game keeps moving.

### Frontend

- As a player, I want to see the countdown timer so that I know how much time is left.
- As a player, I want revealed letters to appear live in the UI so that I can react to new information.
- As a player, I want a clear indication when time is up so that I understand why the turn ended.

---

## 7. Guessing System

### Backend

- As a player, I want to submit a guess so that I can try to solve the word.
- As the system, I want to validate that the guess comes from the active player so that turn rules are respected.
- As the system, I want to compare the guess against the correct word so that I can determine whether it is right or wrong.
- As the system, I want to save the winner of the round when a correct guess is made so that scoring and round completion can be handled.
- As the system, I want to ignore guesses submitted after timeout so that expired turns do not affect gameplay.

### Frontend

- As a player, I want an input field for my guess so that I can submit an answer.
- As a player, I want a button to send my guess so that the interaction is explicit.
- As a player, I want feedback showing whether my guess was correct or incorrect so that I know the result immediately.
- As a player, I want the input field cleared after submission so that I can easily make a new guess later.

---

## 8. Scoring System

### Backend

- As the system, I want to calculate points based on the wheel value so that correct guesses award the proper score.
- As the system, I want to update the player’s total score so that standings are always accurate.
- As the system, I want to keep score for all players within a match so that a winner can be determined.

### Frontend

- As a player, I want to see points awarded after each round so that I understand what was earned.
- As a player, I want to see the live total score so that I can track who is leading.

---

## 9. Ending Screen

### Backend

- As the system, I want to determine the winner after three rounds so that the match has a final result.
- As the system, I want to return the final standings so that the frontend can display the outcome.

### Frontend

- As a player, I want a result screen at the end of the match so that I can clearly see that the game is over.
- As a player, I want to see who won so that the outcome is obvious.
- As a player, I want to see all players’ final scores so that the results are transparent.
- As a player, I want a “Play Again” option so that I can quickly start over.
- As a player, I want an “Exit” option so that I can leave the match flow.

---

## 10. Real-Time Support (Minimum MVP)

### Backend

- As the system, I want to use WebSocket or SignalR so that all players receive updates instantly.
- As the system, I want to broadcast lobby updates so that all clients stay synchronized.
- As the system, I want to broadcast turn changes so that players always know whose turn it is.
- As the system, I want to broadcast timer updates so that countdowns stay in sync.
- As the system, I want to broadcast letter reveals so that all players see the same word state.
- As the system, I want to broadcast score updates so that all clients show the same standings.
- As the system, I want to broadcast round status changes so that the entire game flow stays synchronized.

### Frontend

- As a player, I want the client to listen for real-time server events so that the UI updates without refresh.
- As a player, I want the UI to react instantly to game events so that multiplayer gameplay feels live.

---

# Minimal Domain Model (MVP)

## Match

- id
- guid
- round
- status

## Player

- id
- name
- score

## MatchPlayer

- relation between Match and Player

## Round

- word
- revealedLetters

## Guess

- playerId
- guess
- correct

---

# Build Order / Critical Priority

1. Lobby (create + join + ready)
2. Match start + turn order
3. Hidden word + UI (`_ _ _ _`)
4. Timer
5. Guessing system
6. Scoring
7. Ending screen
8. Real-time integration

---

# Suggested Epic Structure

## Epic 1: Lobby & Match Setup

Covers match creation, joining, player readiness, and automatic start.

## Epic 2: Core Round Flow

Covers rounds, active player logic, word setup, and turn rotation.

## Epic 3: Guessing & Scoring

Covers guesses, validation, wheel points, and score tracking.

## Epic 4: Timer & Reveal Mechanics

Covers countdown, reveal logic, and timeout handling.

## Epic 5: Endgame

Covers winner calculation and result screen.

## Epic 6: Real-Time Multiplayer

Covers SignalR/WebSocket communication and synchronized frontend updates.
