export default function RulesPage({ onBack }) {
  return (
    <main className="page rules-page">
      <section className="card rules-card">
        <div className="rules-header">
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "2rem",
            }}
          >
            <h1 style={{ margin: 0 }}>Game Rules</h1>
            <button
              type="button"
              className="rules-back"
              style={{
                position: "absolute",
                right: 0,
                marginTop: 0,
                padding: "0.28rem 0.62rem",
                fontSize: "0.9rem",
                letterSpacing: "0.03em",
              }}
              onClick={onBack}
            >
              Back
            </button>
          </div>
          <p>Wheel of Speed is a two-player word guessing game with turn-based rounds and score-based rewards.</p>
        </div>

        <div className="rules-grid">
          <div className="rules-section">
            <h2>How a Match Starts</h2>
            <ul className="rules-list">
              <li>One player creates a lobby and shares the code.</li>
              <li>The second player joins using the lobby code.</li>
              <li>Both players mark themselves ready before the first round begins.</li>
            </ul>
          </div>

          <div className="rules-section">
            <h2>Round Flow</h2>
            <ul className="rules-list">
              <li>Players take turns being the active player.</li>
              <li>The active player spins the wheel to lock in the reward value.</li>
              <li>The spin also reveals the first letter of the hidden word.</li>
              <li>The active player then guesses the word before time runs out.</li>
            </ul>
          </div>

          <div className="rules-section">
            <h2>Scoring</h2>
            <ul className="rules-list">
              <li>A correct guess awards the spun wheel value to the active player.</li>
              <li>An incorrect guess keeps the round alive until it resolves.</li>
              <li>The match winner is the player with the highest score after the final round.</li>
            </ul>
          </div>

          <div className="rules-section">
            <h2>Match Setup</h2>
            <ul className="rules-list">
              <li>You can choose the difficulty when creating a lobby.</li>
              <li>You can choose an even number of rounds from 4 to 16.</li>
              <li>After a finished match, players can challenge each other to a rematch.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}