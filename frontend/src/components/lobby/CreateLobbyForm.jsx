export default function CreateLobbyForm({ name, onNameChange, onSubmit, onBack }) {
  return (
    <>
      <label>Name</label>
      <input
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="Enter name"
      />

      <div className="actions">
        <button onClick={onSubmit} disabled={!name.trim()}>
          Create Game
        </button>
        <button onClick={onBack}>Back</button>
      </div>
    </>
  )
}
