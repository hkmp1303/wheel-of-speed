# Changelog

## [Unreleased] - Prize Wheel updates

- 2026-04-19
- Fix: MatchHub DI & SignalR stability
  - MatchHub constructor now depends on DI-registered interfaces (`IMatchService`, `IMatchEngine`) so SignalR can activate the hub correctly. This resolves SignalR connection errors that were closing client connections during OnConnectedAsync.

- Hub API change: server RequestSpin signature
  - `RequestSpin` now accepts an explicit `playerId` argument and validates that the caller is the active player for the match. Frontend updated to pass `playerId` when invoking the hub.

- Frontend updates
  - `MatchPage.jsx`: updated the SignalR invoke to `connection.invoke('RequestSpin', matchCode, playerId)` so the server receives the caller identity.
  - `GameContext.jsx`: fixed hub URL query construction and adjusted SignalR connection lifecycle handling.
  - `LobbyPage.jsx`: Ready button behavior corrected (no longer incorrectly blocked by connection state). Ready still posts to the API and the server broadcasts match updates via SignalR.

- Server CORS and preflight handling
  - Added a small middleware in `Program.cs` to ensure `Access-Control-*` headers are present on all responses (including error responses) and to short-circuit OPTIONS preflight with 204. The app still registers a permissive CORS policy for development.

- Game loop behavior
  - The server-side game loop was adjusted so the round countdown and automatic letter reveals do not start until the wheel has been spun for the active player. This prevents the timer/reveal from progressing before points are set.

- Build and verification
  - Corrected hub constructor signatures; server builds successfully in CI/dev after these changes.

Notes / next steps
- Add integration tests that exercise SignalR `RequestSpin` + match broadcasts and validate authorization (active player only).
- Consider tightening CORS policy before production (restrict origins instead of echoing Origin).
- Optionally wire SignalR authentication so `Context.UserIdentifier` is populated and the hub can rely on it instead of requiring explicit `playerId` in every call.
