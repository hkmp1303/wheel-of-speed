import { useState } from "react";
import { useGame } from "../context/GameContext";

export default function HomePage() {
  const { createMatch, joinMatch } = useGame();
  const pathMatch = window.location.pathname.match(/^\/join\/([^/]+)$/i);
  const initialJoinCode = pathMatch?.[1]?.toUpperCase() ?? "";
  const isJoinFlow = Boolean(initialJoinCode);
  const [mode, setMode] = useState(isJoinFlow ? "join" : null);
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [difficulty, setDifficulty] = useState("Normal");
  const [maxRounds, setMaxRounds] = useState(4);

  if (!mode) {
    return (
      <main className="page">
        <section className="card home-card" style={{ textAlign: "center" }}>
          <h1>Wheel of Speed</h1>
          <p>Welcome! Choose how you want to play.</p>

          <div className="actions" style={{ justifyContent: "center", marginTop: "1.5rem" }}>
            <button onClick={() => setMode("create")}>Create Game</button>
            <button onClick={() => setMode("join")}>Join Game</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card home-card">
        <h1>Wheel of Speed</h1>
        <p>{mode === "create" ? "Set up a new match." : "Join a friend using a code."}</p>

        <div className="home-field">
          <label>Name</label>
          <input
            id={mode === "join" ? "player-name-input" : "host-name-input"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name"
          />
        </div>

        {mode === "create" && (
          <>
            <div className="home-field">
              <label>Difficulty</label>
              <div className="actions">
                {["Easy", "Normal", "Hard"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    style={{
                      background: difficulty === d ? "#5b8cff" : "#171c26",
                      color: difficulty === d ? "#0b1220" : "#f5f7fb",
                      border: "1px solid #2b3342"
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="home-field">
              <label>Rounds</label>
              <select
                value={maxRounds}
                onChange={(e) => setMaxRounds(Number(e.target.value))}
                className="rounds-select"
              >
                {[4, 6, 8, 10, 12, 14, 16].map((roundOption) => (
                  <option key={roundOption} value={roundOption}>
                    {roundOption}
                  </option>
                ))}
              </select>
            </div>

            <div className="actions home-submit">
              <button onClick={() => createMatch(name, difficulty, maxRounds)} disabled={!name.trim()}>
                Create Game
              </button>
            </div>
          </>
        )}

        {mode === "join" && (
          <>
            <div className="home-field">
              <label>Join via code</label>
              <input
                id="join-code-input"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="GUID code"
                readOnly={isJoinFlow}
              />
            </div>

            <div className="actions home-submit">
              <button
                id="join-game-btn"
                onClick={() => joinMatch(joinCode, name)}
                disabled={!name.trim() || !joinCode.trim()}
              >
                Join Game
              </button>
            </div>
          </>
        )}

        {!isJoinFlow && (
          <div className="actions" style={{ marginTop: "1rem" }}>
            <button onClick={() => setMode(null)}>Back</button>
          </div>
        )}
      </section>
    </main>
  );
}