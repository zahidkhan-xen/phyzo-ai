#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
trap 'kill $(jobs -p) 2>/dev/null || true' EXIT INT TERM

if [ ! -d backend/dist ] || [ ! -d frontend/.next ]; then
  echo "Build output is missing. Run 'npm run build' first." >&2
  exit 1
fi

echo "Starting production API and frontend..."
(cd backend && npm start) &
(cd frontend && npm start) &

wait -n
