# 2026-10-30 — AGENT — Status changes and audit events share one SQLite transaction

- **ID:** DL:status-change-atomic-audit-20261030-012241
- **Subject:** TaskFlow, api, SQLite, status transitions, audit_events
- **Claim:** The new TaskFlow status-change implementation writes the task status/update timestamp and its task.status_changed audit event inside a single better-sqlite3 transaction, so an audit insert failure is intended to roll back the status change.
- **Evidence date:** 2026-10-30
- **Status:** live
- **Contributed-by:** agent — OpenAI ChatGPT / GPT-6, 2026-10-30
- **Review:** unreviewed

**Category:** AGENT (provisional domain learning)

> **Review: unreviewed** — implementation hypothesis and test evidence, not an operator-ratified invariant. Test execution must be confirmed independently.

## Hypothesis

A status mutation is not complete unless its corresponding audit event commits atomically; a failed audit insert must leave both the status and updated_at unchanged.

## Evidence

- `api/src/taskRepository.ts`: `updateTaskStatusTx` loads previous status, updates status and updated_at, and inserts `task.status_changed` with actor, timestamp, requestId, before.status and after.status inside one `db.transaction`. A nonexistent task returns undefined without an audit write.
- `api/src/app.ts`: `PATCH /api/tasks/:id/status` validates positive safe integer path IDs, validates the exact status-only body with the shared Zod schema, maps invalid requests to 400, missing tasks to 404, and successful updates to 200. Unexpected errors propagate to the existing 500 handler.
- `shared/src/task.ts`: `UpdateTaskStatusInputSchema` derives its status values from the existing `TaskStatusSchema` and rejects unknown body fields.
- `api/test/taskStatus.test.ts`: real in-memory SQLite repository tests for status and audit metadata, sequential before/after transitions, missing IDs, and forced audit insertion failure that must roll back both task status and updated_at.
- `api/test/taskStatusHttp.test.ts`: Fastify injection tests for 200/400/404, sequential transitions, request-correlated audit fields, and HTTP 500 with complete SQLite rollback after a RAISE(ABORT) trigger.
- **Execution:** Tests were authored but **not executed by ChatGPT**. Assertions and implementation require independent execution and review before ratification.

## Prior art / cross-vendor provenance

Builds on Claude Code's provisional `DL:task-mutation-atomic-audit` (2026-10-30, `claude-code/2.1.314`, **Review: unreviewed**). That learning experimentally concerned task creation; this separate GPT-6 contribution extends the transaction pattern to status changes. Neither is automatically authoritative.

## Scope and limitations

No UI changes, migrations, or DOMAIN_REF promotion. The implemented route audits each accepted status update, including an unchanged status value; it does not enforce transition business rules. Does not prove runtime test success, concurrency behavior or broader mutation atomicity.

## Verdict

Provisional — implementation and tests committed for independent Claude Code verification. **Review: unreviewed** until operator Brain Audit approval.

## Cross-links

- Previous learning: `.salvor/domain-learnings/2026-10-30-AGENT-task-mutation-atomic-audit.md`
- New repository code and tests: `api/src/taskRepository.ts`, `api/src/app.ts`, `shared/src/task.ts`, `api/test/taskStatus.test.ts`, `api/test/taskStatusHttp.test.ts`
- Registry: `.salvor/domain-learnings/README.md`
- DOMAIN_REF: intentionally unchanged.
