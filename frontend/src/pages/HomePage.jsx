import { useState } from "react";
import { useGame } from "../context/GameContext";

export default function HomePage() {
  const { createMatch, joinMatch } = useGame();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [difficulty, setDifficulty] = useState("Normal");

  return (
    <main className="page">
      <section className="card">
        <h1>Wheel of Speed</h1>
        <p>Guess the word, simple as that.</p>

        <label>Namn</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ange namn"
        />

        <label>Svårighetsgrad</label>
        <div className="actions">
          {["Easy", "Normal", "Hard"].map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              style={{
                background: difficulty === d ? "#5b8cff" : "#171c26",
                border: "1px solid #2b3342"
              }}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="actions">
          <button onClick={() => createMatch(name, difficulty)} disabled={!name.trim()}>
            Create Game
          </button>
        </div>

        <hr />

        <label>Join via code</label>
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="GUID code"
        />

        <div className="actions">
          <button
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