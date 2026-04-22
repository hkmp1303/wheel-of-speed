export default function JoinLobbyForm({
  name,
  joinCode,
  onNameChange,
  onJoinCodeChange,
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

      <label>Join via code</label>
      <input
        value={joinCode}
        onChange={(event) => onJoinCodeChange(event.target.value)}
        placeholder="GUID code"
      />

      <div className="actions">
        <button onClick={onSubmit} disabled={!name.trim() || !joinCode.trim()}>
          Join Game
        </button>
        <button onClick={onBack}>Back</button>
      </div>
    </>
  )
}
