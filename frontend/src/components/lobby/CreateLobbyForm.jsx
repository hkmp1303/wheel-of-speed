export default function CreateLobbyForm({
  name,
  difficulty,
  maxRounds,
  onNameChange,
  onDifficultyChange,
  onMaxRoundsChange,
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

      <label>Rounds</label>
      <select
        value={maxRounds}
        onChange={(e) => onMaxRoundsChange(Number(e.target.value))}
        className="rounds-select"
      >
        {[4, 6, 8, 10, 12, 14, 16].map((roundOption) => (
          <option key={roundOption} value={roundOption}>
            {roundOption}
          </option>
        ))}
      </select>

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
