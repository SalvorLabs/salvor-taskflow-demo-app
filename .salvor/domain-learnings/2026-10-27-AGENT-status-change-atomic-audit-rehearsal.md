# 2026-10-27 — AGENT — Status transitions and audit inserts share a transaction

- **ID:** DL:status-change-atomic-audit-rehearsal
- **Subject:** api, sqlite, audit_events, status-transitions, cross-vendor-handoff
- **Claim:** A TaskFlow status transition and its audit event must commit or roll back together, preserving the previous status on audit failure.
- **Evidence date:** 2026-10-27
- **Status:** live
- **Contributed-by:** agent — ChatGPT/GPT-6, 2026-10-27
- **Review:** unreviewed

**Category:** AGENT (provisional domain learning)

> **Review: unreviewed** — this is GPT-authored provisional engineering knowledge, not an operator-ratified rule. Confirm against executable tests before relying on it.

## Hypothesis
When an existing task changes status, the update to `tasks` and the `task.status_changed` row in `audit_events` should be one synchronous better-sqlite3 transaction.

## Evidence
1. Claude Code's earlier provisional `DL:task-mutation-atomic-audit` documents empirically tested creation atomicity at TaskFlow baseline `6e74158`. It motivated this implementation but was not treated as authoritative.
2. GPT-6 added `updateTaskStatusTx` in `api/src/taskRepository.ts` on branch `chatgpt/task-status-audit-rehearsal`. It reads the old status, updates the task, and writes an audit event with actor, request ID, and before/after statuses inside the same `db.transaction`.
3. GPT-6 added `PATCH /api/tasks/:id/status` in `api/src/app.ts` and the Zod input schema in `shared/src/task.ts`.
4. GPT-6 added regression tests in `api/test/taskStatus.test.ts` covering rollback on a forced SQLite audit insert failure, HTTP success and errors, missing tasks, before/after metadata, and multiple transitions; `shared/test/updateTaskStatus.test.ts` covers input validation.
5. **Verification status:** Source changes and tests were authored remotely through ChatGPT's GitHub integration. Tests have **not yet been executed in a checked-out repository by ChatGPT**; Claude Code or CI must execute them and report the result before treating the hypothesis as experimentally validated.

## Verdict
Provisional implementation claim, pending test execution and operator review. Do not equate source inspection with passing tests.

## Scope and limits
- Applies to synchronous status updates in this TaskFlow SQLite repository.
- This branch and learning are for the disposable cross-vendor rehearsal; `main` remains unchanged.
- No claim about distributed or asynchronous audit delivery.

## Cross-links
- Earlier Claude artifact: `DL:task-mutation-atomic-audit`
- Code: `api/src/taskRepository.ts`, `api/src/app.ts`, `shared/src/task.ts`
- Tests: `api/test/taskStatus.test.ts`, `shared/test/updateTaskStatus.test.ts`
- Registry: `.salvor/domain-learnings/README.md`
- Governance: `Review: unreviewed`; no `DOMAIN_REF.md` promotion
