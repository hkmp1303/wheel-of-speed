import { useState } from "react";
import CreateLobbyForm from "../components/lobby/CreateLobbyForm";
import JoinLobbyForm from "../components/lobby/JoinLobbyForm";
import { useGame } from "../context/GameContext";

function parseJoinPath() {
  const pathMatch = window.location.pathname.match(/^\/join\/([^/]+)$/i);
  const code = pathMatch?.[1]?.replace(/\s+/g, "").toUpperCase() ?? "";
  return { isJoinDeepLink: Boolean(code), initialJoinCode: code };
}

export default function HomePage() {
  const { createMatch, joinMatch, error } = useGame();
  const { isJoinDeepLink, initialJoinCode } = parseJoinPath();

  const [view, setView] = useState(isJoinDeepLink ? "join" : "menu");
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [difficulty, setDifficulty] = useState("Normal");
  const [maxRounds, setMaxRounds] = useState(4);

  return (
    <main className="page">
      <section className="card home-card">
        <h1>Wheel of Speed</h1>

        {view === "menu" && (
          <div className="actions">
            <button type="button" onClick={() => setView("create")}>
              Create Lobby
            </button>
            <button type="button" onClick={() => setView("join")}>
              Join Lobby
            </button>
          </div>
        )}

        {view === "create" && (
          <CreateLobbyForm
            name={name}
            difficulty={difficulty}
            maxRounds={maxRounds}
            onNameChange={setName}
            onDifficultyChange={setDifficulty}
            onMaxRoundsChange={setMaxRounds}
            onSubmit={() => void createMatch(name.trim(), difficulty, maxRounds)}
            onBack={() => setView("menu")}
          />
        )}

        {view === "join" && (
          <JoinLobbyForm
            name={name}
            joinCode={joinCode}
            onNameChange={setName}
            onJoinCodeChange={(value) =>
              setJoinCode(value.replace(/\s+/g, "").toUpperCase())
            }
            onSubmit={() => void joinMatch(joinCode.trim(), name.trim())}
            onBack={() => setView("menu")}
            joinCodeReadOnly={isJoinDeepLink}
          />
        )}

        {error ? <p className="error">{error}</p> : null}
      </section>
    </main>
  );
}
