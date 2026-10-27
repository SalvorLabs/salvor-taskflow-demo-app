#!/usr/bin/env bash
# Creates one task through the running API and shows the audit row written with it.
# Usage: npm run verify:audit            (API on http://127.0.0.1:3001)
#        API_URL=http://host:port npm run verify:audit
set -euo pipefail
API_URL="${API_URL:-http://127.0.0.1:3001}"
DB_PATH="${TASKFLOW_DB_PATH:-api/data/taskflow.db}"
TITLE="${1:-Verify audit trail $(date -u +%H:%M:%S)}"

echo "→ POST $API_URL/api/tasks"
CREATED=$(curl -sS -f -X POST "$API_URL/api/tasks" \
  -H 'content-type: application/json' \
  -d "{\"title\":\"$TITLE\",\"description\":\"Created by scripts/verify-audit.sh\",\"status\":\"todo\"}")
echo "$CREATED"
TASK_ID=$(printf '%s' "$CREATED" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).id))')

echo
echo "→ GET $API_URL/api/audit-events?taskId=$TASK_ID"
curl -sS -f "$API_URL/api/audit-events?taskId=$TASK_ID"
echo

if command -v sqlite3 >/dev/null && [ -f "$DB_PATH" ]; then
  echo
  echo "→ sqlite3 $DB_PATH (task $TASK_ID and its audit rows)"
  sqlite3 -header -column "$DB_PATH" \
    "SELECT id, title, status, created_at FROM tasks WHERE id = $TASK_ID;
     SELECT id, action, task_id, actor, created_at, metadata FROM audit_events WHERE task_id = $TASK_ID;"
fi
