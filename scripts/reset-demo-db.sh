#!/usr/bin/env bash
# Deletes ONLY the local TaskFlow demo database (api/data/taskflow.db*) so the next API start re-seeds it.
# It never touches .salvor/, git history, GitHub, or any Salvor billing / MCP state.
# Destructive, so it is opt-in: pass --yes.   Usage: npm run demo:reset-db -- --yes
set -euo pipefail
cd "$(dirname "$0")/.."
DB="api/data/taskflow.db"
if [ "${1:-}" != "--yes" ]; then
  echo "This deletes $DB (and its -wal/-shm files). Stop the API first, then re-run with --yes."
  exit 1
fi
if pgrep -f "tsx.*src/server.ts" >/dev/null; then
  echo "The TaskFlow API looks like it is running. Stop it (Ctrl-C in 'npm run dev') and retry."
  exit 1
fi
rm -fv "$DB" "$DB-wal" "$DB-shm" "$DB-journal"
echo "Done. The next 'npm run dev' re-creates and re-seeds the database."
