import { useState } from "react";
import { useGame } from "../context/GameContext";

export default function HomePage() {
  const { createMatch, joinMatch } = useGame();
  const pathMatch = window.location.pathname.match(/^\/join\/([^/]+)$/i);
  const initialJoinCode = pathMatch?.[1]?.toUpperCase() ?? "";
  const isJoinFlow = Boolean(initialJoinCode);
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState(initialJoinCode);

  return (
    <main className="page">
      <section className="card">
        <h1>Wheel of Speed</h1>
        <p>Guess the word, simple as that.</p>

        <label>Namn</label>
        <input
          id={isJoinFlow ? "player-name-input" : "host-name-input"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ange namn"
        />

        {!isJoinFlow && (
          <div className="actions">
            <button
              id="create-game-btn"
              onClick={() => createMatch(name)}
              disabled={!name.trim()}
            >
              Create Game
            </button>
          </div>
        )}

        {!isJoinFlow && <hr />}

        <label>Join via code</label>
        <input
          id="join-code-input"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="GUID code"
          readOnly={isJoinFlow}
        />

        <div className="actions">
          <button
            id="join-game-btn"
            onClick={() => joinMatch(joinCode, name)}
            disabled={!name.trim() || !joinCode.trim()}
          >
            Join Game
          </button>
        </div>
      </section>
    </main>
  );
}
