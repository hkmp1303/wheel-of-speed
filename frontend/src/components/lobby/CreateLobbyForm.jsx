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
      <label>Name</label>
      <input
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="Enter name"
      />

      <label>Difficulty</label>
      <select value={difficulty} onChange={(event) => onDifficultyChange(event.target.value)}>
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
      </select>

      <div className="actions">
        <button onClick={onSubmit} disabled={!name.trim()}>
          Create Game
        </button>
        <button onClick={onBack}>Back</button>
      </div>
    </>
  )
}
