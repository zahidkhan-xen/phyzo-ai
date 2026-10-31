#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
trap 'kill $(jobs -p) 2>/dev/null || true' EXIT INT TERM

echo "Starting API and frontend..."
(cd backend && npm run dev) &
(cd frontend && npm run dev) &

wait -n
