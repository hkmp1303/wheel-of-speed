export default function CreateLobbyForm({
  name,
  difficulty,
  onNameChange,
  onDifficultyChange,
  onSubmit,
  onBack,
}) {
  return (
    <>
      <label>Namn</label>
      <input
        id="host-name-input"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Ange namn"
      />

      <label>Svårighetsgrad</label>
      <div className="actions">
        {["Easy", "Normal", "Hard"].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onDifficultyChange(d)}
            style={{
              background: difficulty === d ? "#5b8cff" : "#171c26",
              border: "1px solid #2b3342",
            }}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="actions">
        <button type="button" onClick={onSubmit} disabled={!name.trim()}>
          Create Game
        </button>
        <button type="button" onClick={onBack}>
          Back
        </button>
      </div>
    </>
  );
}
