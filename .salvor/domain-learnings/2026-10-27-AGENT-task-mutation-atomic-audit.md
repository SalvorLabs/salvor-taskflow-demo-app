# 2026-10-27 — AGENT — Task mutations must preserve the audit trail atomically

- **ID:** DL:task-mutation-atomic-audit
- **Subject:** api, sqlite, audit_events, task-mutations, better-sqlite3
- **Claim:** Task mutations should preserve audit consistency atomically, so failed audit writes cannot leave untracked state changes.
- **Evidence date:** 2026-10-27
- **Status:** live
- **Contributed-by:** agent — claude-code/2.1.311, 2026-10-27
- **Review:** unreviewed

**Category:** AGENT (provisional domain learning)

> **Review: unreviewed** — hypothesis, not invariant (RULES §10.5). Cite this provenance when acting on it;
> it never relaxes a rule and never overrides ratified knowledge.

## Hypothesis
Task mutations should preserve audit consistency atomically, so failed audit writes cannot leave untracked state changes.

## Evidence
Observed in TaskFlow at commit 6e74158 (main), 2026-10-27.
1. Implementation: api/src/taskRepository.ts:77-92 — `createTaskTx = db.transaction(...)` runs `insertTask.run(...)` (tasks INSERT) then `insertAudit.run(...)` (audit_events INSERT, action 'task.created', actor, created_at, JSON metadata {requestId, after}) inside ONE better-sqlite3 transaction; any throw rolls back both. Reached from POST /api/tasks (api/src/app.ts:20) via repo.createTask.
2. Schema guards: api/src/db.ts migration 001_create_tasks_and_audit_events — audit_events.task_id FK -> tasks.id, CHECK(length(actor) > 0), CHECK(json_valid(metadata)).
3. Tests (real in-memory SQLite, failures injected with SQLite RAISE(ABORT) triggers from api/test/helpers.ts, no mocks): api/test/taskRepository.test.ts:49 describe 'task creation audit atomicity' — 'rolls back the task when the audit insert fails', 'never leaves a ghost audit event when the task insert fails', 'rolls back when the audit row violates a constraint (empty actor)', 'keeps one audit event per task across many creates'. Result: `npx vitest run --project api -t "atomicity"` -> 4 passed. HTTP counterpart: api/test/app.test.ts:109 'returns 500 and persists neither row when the audit insert fails'.
4. Negative control (recorded in .salvor/active_state_verbose.md): replacing db.transaction with an identity wrapper made 3 of these tests fail; restoring it made them pass.

## Notes
## Hypothesis
In TaskFlow, a task write and its audit_events row either both persist or neither does, because they share one SQLite transaction.

## Verdict
Accepted for task **creation** (the only mutation implemented at 6e74158). Evidence: code inspection plus 4 passing atomicity tests and a negative control.

## Scope and limits
- Observed for `POST /api/tasks` / `createTask` only. No other task mutation exists yet.
- This is a project-specific pattern, not a universal rule. It relies on better-sqlite3's synchronous `db.transaction` and a single SQLite connection.
- Single-process, single-database scope only. It says nothing about cross-service or async audit sinks.

## Implication for future work (recommendation, not a ratified rule)
A new task mutation endpoint, such as the planned `PATCH /api/tasks/:id/status`, should write its task update and a matching audit_events row (e.g. `task.status_changed` with before/after metadata) in the same transaction. It should add rollback tests in the same style. Check this against the current source and tests before relying on it; this capture is `Review: unreviewed`.

## Cross-links
- Code: api/src/taskRepository.ts, api/src/app.ts, api/src/db.ts
- Tests: api/test/taskRepository.test.ts, api/test/app.test.ts, api/test/helpers.ts
- L1/L2: .salvor/active_state.md (Tests line), .salvor/active_state_verbose.md (2026-10-27 api baseline entry)

## Verdict
Provisional — awaiting operator ratification via the Brain Audit (RULES §10.3 / §10.5).

## Cross-links
- Registry: `.salvor/domain-learnings/README.md` (chronological index row added by the agent).
- DOMAIN_REF.md: NOT updated — unreviewed knowledge never becomes current truth automatically.
