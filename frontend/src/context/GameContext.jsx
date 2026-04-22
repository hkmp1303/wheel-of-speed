import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as signalR from "@microsoft/signalr";

const GameContext = createContext(null);

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

export function GameProvider({ children }) {
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [matchCode, setMatchCode] = useState("");
  const [matchState, setMatchState] = useState(null);
  const [connection, setConnection] = useState(null);
  const [connectionState, setConnectionState] = useState("Disconnected");
  const [error, setError] = useState("");
  const [rematchState, setRematchState] = useState(null);
  const apiBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? "");
  const apiPath = (path) => `${apiBaseUrl}${path}`;
  const hubUrl = apiBaseUrl ? `${apiBaseUrl}/hubs/match` : "/hubs/match";

  const api = useMemo(
    () => ({
      async createMatch(name, difficulty = "Normal") {
        setError("");
        const response = await fetch("/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hostName: name, difficulty }),
        });
        if (!response.ok) {
          const err = await response
            .json()
            .catch(() => ({ error: "Failed to create match." }));
          setError(err.error || "Failed to create match.");
          return null;
        }
        const data = await response.json();
        const createdPlayer = data.players[0];
        setPlayerName(name);
        setPlayerId(createdPlayer.playerId);
        setMatchCode(data.guidCode);
        setMatchState(data);
        return data;
      },
      async joinMatch(code, name) {
        setError("");
        const response = await fetch(`/api/matches/${code}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerName: name }),
        });
        if (!response.ok) {
          const err = await response
            .json()
            .catch(() => ({ error: "Failed to join match." }));
          setError(err.error || "Failed to join match.");
          return null;
        }
        const data = await response.json();
        const joinedPlayer = data.players.find((player) => player.name.toLowerCase() === name.toLowerCase());
        setPlayerName(name);
        setPlayerId(joinedPlayer?.playerId ?? "");
        setMatchCode(data.guidCode);
        setMatchState(data);
        return data;
      },
      async markReady() {
        const response = await fetch(
          apiPath(`/api/matches/${matchCode}/ready`),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId }),
          },
        );
        if (!response.ok) {
          const err = await response
            .json()
            .catch(() => ({ error: "Failed to mark ready." }));
          setError(err.error || "Failed to mark ready.");
          return;
        }
        const data = await response.json();
        setMatchState(data);
      },
      async spin() {
        const response = await fetch(
          apiPath(`/api/matches/${matchCode}/spin`),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId }),
          },
        );
        if (!response.ok) {
          const err = await response
            .json()
            .catch(() => ({ error: "Failed to spin." }));
          setError(err.error || "Failed to spin.");
          return;
        }
        const data = await response.json();
        setMatchState(data);
      },
      async guess(guess) {
        const response = await fetch(
          apiPath(`/api/matches/${matchCode}/guess`),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId, guess })
          }
        );
        if (!response.ok) {
          const err = await response
            .json()
            .catch(() => ({ error: "Failed to submit guess." }));
          setError(err.error || "Failed to submit guess.");
          return null;
        }
        const data = await response.json();
        setMatchState(data);
        return data;
      },
      async fetchMatch(code) {
        const response = await fetch(apiPath(`/api/matches/${code}`));
        if (!response.ok) {
          const err = await response
            .json()
            .catch(() => ({ error: "Match not found." }));
          setError(err.error || "Match not found.");
          return null;
        }
        const data = await response.json();
        setMatchCode(code);
        setMatchState(data);
        setRematchState(null);
        return data;
      },
      async requestRematch() {
        const response = await fetch(
          apiPath(`/api/matches/${matchCode}/rematch/challenge`),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId }),
          }
        );
        if (!response.ok) {
          const err = await response
            .json()
            .catch(() => ({ error: "Failed to request rematch." }));
          setError(err.error || "Failed to request rematch.");
          return null;
        }
        const data = await response.json();
        setRematchState(data);
        return data;
      },
      async acceptRematch() {
        const response = await fetch(
          apiPath(`/api/matches/${matchCode}/rematch/respond`),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId, accept: true }),
          }
        );
        if (!response.ok) {
          const err = await response
            .json()
            .catch(() => ({ error: "Failed to accept rematch." }));
          setError(err.error || "Failed to accept rematch.");
          return null;
        }
        const data = await response.json();
        setRematchState(data);
        return data;
      },
      async declineRematch() {
        const response = await fetch(
          apiPath(`/api/matches/${matchCode}/rematch/respond`),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId, accept: false }),
          }
        );
        if (!response.ok) {
          const err = await response
            .json()
            .catch(() => ({ error: "Failed to decline rematch." }));
          setError(err.error || "Failed to decline rematch.");
          return null;
        }
        const data = await response.json();
        setRematchState(null);
        return data;
      },
      async leaveToHome() {
        if (connection) {
          try {
            await connection.stop();
          } catch {
            // Ignore shutdown failures when resetting the client state.
          }
        }

        setPlayerName("");
        setPlayerId("");
        setMatchCode("");
        setMatchState(null);
        setConnection(null);
        setConnectionState("Disconnected");
        setRematchState(null);
        setError("");
        window.history.replaceState({}, "", "/");
      },
    }),
    [matchCode, playerId, connection],
  );

  useEffect(() => {
    if (!matchCode) return;

    // Discover a reachable backend URL by probing common development ports.
    // This helps when the backend runs on 5000 or 5001, or when another process
    // occupies 5000. If none respond, fall back to the relative "/hubs/match"
    // path (useful when using a dev proxy).
    async function resolveHubUrl() {
      const proto = window.location.protocol;
      const host = window.location.hostname;
      // revert to using a fixed configurable port. Use window.__BACKEND_PORT__ if provided,
      // otherwise default to 5000. If the health check does not succeed, throw an error
      // (hard fail) so callers can handle the unreachable backend explicitly.
      const port = (typeof window.__BACKEND_PORT__ !== "undefined" && window.__BACKEND_PORT__) ? String(window.__BACKEND_PORT__) : "5000";

      const health = `${proto}//${host}:${port}/api/health`;
      try {
        const res = await fetch(health, { method: "GET" });
        if (res.ok) {
          return `${proto}//${host}:${port}/hubs/match`;
        }
        throw new Error(`Backend health check returned ${res.status} at ${health}`);
      } catch (err) {
        // Hard fail: bubble error to the caller so we don't silently fall back.
        throw new Error(`Backend not reachable at ${health}: ${err?.message ?? err}`);
      }
    }

    const hubConnectionPromise = resolveHubUrl().then((hubUrl) => {
      console.log("GameContext: connecting to SignalR hub at", hubUrl);
      // If we have a playerId, attach it as a query string so the hub could
      // pick it up as Context.UserIdentifier in the future (requires server
      // configuration). For now, keep the connection standard and rely on
      // explicit playerId arguments for hub methods.
      const urlWithQuery = matchCode && playerId ? `${hubUrl}?playerId=${encodeURIComponent(playerId)}` : hubUrl;

      const hb = new signalR.HubConnectionBuilder()
        .withUrl(urlWithQuery)
        .withAutomaticReconnect()
        .build();

      // lifecycle hooks to update connection state
      hb.onreconnecting((err) => {
        console.warn("SignalR reconnecting", err);
        setConnectionState("Reconnecting");
      });
      hb.onreconnected(() => {
        console.log("SignalR reconnected");
        setConnectionState("Connected");
      });
      hb.onclose((err) => {
        console.warn("SignalR closed", err);
        setConnectionState("Disconnected");
      });

      return hb;
    });

    // Create connection when resolved
    hubConnectionPromise.then(hubConnection => {
      hubConnection.on("matchUpdated", (state) => {
        setMatchState(state);
      });

      hubConnection.on("rematchChallenged", (result) => {
        setRematchState({ status: "challenged", ...result });
      });

      hubConnection.on("rematchAccepted", (result) => {
        setRematchState({ status: "accepted", ...result });
      });

      hubConnection.on("rematchDeclined", (result) => {
        setRematchState({ status: "declined", ...result });
      });

      // start and update connection state
      setConnectionState("Connecting");
      hubConnection.start()
        .then(() => {
          console.log("SignalR connected");
          setConnectionState("Connected");
          return hubConnection.invoke("JoinMatchGroup", matchCode);
        })
        .catch((err) => {
          console.error("SignalR start failed", err);
          setConnectionState("Disconnected");
          setError("Could not connect to realtime updates.");
        });

      setConnection(hubConnection);
    }).catch(err => {
      console.error("Failed to resolve hub URL", err);
      setError("Could not find backend for realtime updates");
    });

    return () => {
      // Stop the connection if it was created. Use the promise to avoid
      // referencing a local variable that may not be defined yet.
      hubConnectionPromise.then(c => c.stop()).catch(() => { });
    };
  }, [hubUrl, matchCode, playerId]);

  // Separate effect to handle group switching when matchCode changes without reconnecting
  useEffect(() => {
    if (!connection || connectionState !== "Connected" || !matchCode) return;

    const switchGroup = async () => {
      try {
        // The connection already uses JoinMatchGroup internally when started
        // but if matchCode changed after initial connection, we need to rejoin
        await connection.invoke("JoinMatchGroup", matchCode);
        console.log("Switched to match group:", matchCode);
      } catch (err) {
        console.error("Failed to switch match group:", err);
        setError("Failed to switch to new match");
      }
    };

    switchGroup();
  }, [matchCode, connection, connectionState]);

  // Switch to rematch when challenger receives rematchAccepted event
  useEffect(() => {
    if (rematchState?.status === 'accepted' && rematchState?.rematchGuidCode && rematchState?.rematchGuidCode !== matchCode) {
      api.fetchMatch(rematchState.rematchGuidCode);
    }
  }, [rematchState?.status, rematchState?.rematchGuidCode, matchCode, api]);

  return (
    <GameContext.Provider
      value={{
        playerName,
        setPlayerName,
        playerId,
        matchCode,
        matchState,
        rematchState,
        error,
        connection,
        connectionState,
        ...api,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used inside GameProvider");
  return context;
}
