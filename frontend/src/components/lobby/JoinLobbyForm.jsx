export default function JoinLobbyForm({
  name,
  joinCode,
  onNameChange,
  onJoinCodeChange,
  onSubmit,
  onBack,
  joinCodeReadOnly = false,
}) {
  return (
    <>
      <div className="home-field">
        <label>Name</label>
        <input
          id="player-name-input"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter name"
        />
      </div>

      <div className="home-field">
        <label>Join Code</label>
        <input
          id="join-code-input"
          value={joinCode}
          onChange={(e) => onJoinCodeChange(e.target.value)}
          placeholder="GUID code"
          readOnly={joinCodeReadOnly}
        />
      </div>

      <div className="home-field home-submit">
        <div className="actions">
          <button
            id="join-game-btn"
            type="button"
            onClick={onSubmit}
            disabled={!name.trim() || !joinCode.trim()}
          >
            Join Game
          </button>
          <button type="button" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    </>
  );
}
