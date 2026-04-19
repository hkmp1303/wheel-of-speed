#!/usr/bin/env bash
set -euo pipefail

# run.sh — start backend and frontend for local development
# Usage: ./run.sh

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting Wheel of Speed backend and frontend from: $ROOT_DIR"

# Start backend
echo "Starting backend... (logs -> $ROOT_DIR/backend.log)"
pushd "$ROOT_DIR/Server" >/dev/null
# Redirect backend stdout/stderr to backend.log (append)
dotnet run >> "$ROOT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
popd >/dev/null

# Ensure frontend dependencies are present then start frontend dev server
echo "Starting frontend (will run npm install if needed). Logs -> $ROOT_DIR/frontend.log"
pushd "$ROOT_DIR/frontend" >/dev/null
# install dependencies if missing (non-fatal)
npm install --no-audit --no-fund || true
# Redirect frontend dev server output to frontend.log (append)
npm run dev -- --host >> "$ROOT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
popd >/dev/null

echo "Backend PID: $BACKEND_PID  Frontend PID: $FRONTEND_PID"

# Show the last 5 lines from the frontend log to aid quick debugging
if [ -f "$ROOT_DIR/frontend.log" ]; then
  echo "--- frontend.log (last 5 lines) ---"
  tail -n 5 "$ROOT_DIR/frontend.log" || true
  echo "-----------------------------------"
fi

cleanup() {
  echo "Stopping frontend (PID $FRONTEND_PID) and backend (PID $BACKEND_PID)..."

  # Try to kill all background jobs started by this script first.
  if jobs -p >/dev/null 2>&1; then
    PIDS=$(jobs -p)
    if [ -n "$PIDS" ]; then
      echo "Killing background jobs: $PIDS"
      kill $PIDS 2>/dev/null || true
    fi
  fi

  # Fallback: kill stored PIDs directly
  kill "$FRONTEND_PID" 2>/dev/null || true
  kill "$BACKEND_PID" 2>/dev/null || true

  # Wait for processes to exit
  wait || true
  exit 0
}

trap cleanup INT TERM EXIT

# Wait for child processes
wait
