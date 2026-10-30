# 2026-10-30 — AGENT — Task mutations must preserve the audit trail atomically

- **ID:** DL:task-mutation-atomic-audit
- **Subject:** api, sqlite, audit_events
- **Claim:** Task writes must preserve audit consistency atomically so a failed audit write cannot leave an untracked task mutation.
- **Evidence date:** 2026-10-30
- **Status:** live
- **Contributed-by:** agent — claude-code/2.1.312, 2026-10-30
- **Review:** unreviewed

**Category:** AGENT (provisional domain learning)

> **Review: unreviewed** — hypothesis, not invariant (RULES §10.5). Cite this provenance when acting on it;
> it never relaxes a rule and never overrides ratified knowledge.

## Hypothesis
Task writes must preserve audit consistency atomically so a failed audit write cannot leave an untracked task mutation.

## Evidence
Commit 6e74158. Source: api/src/taskRepository.ts:77-92 — createTaskTx = db.transaction{insertTask.run (L79); insertAudit.run action 'task.created' w/ actor, createdAt, metadata{requestId, after} (L81-90); selectById (L91)}; POST /api/tasks calls repo.createTask at api/src/app.ts:30. Tests: api/test/taskRepository.test.ts:49-98 describe "task creation audit atomicity", real in-memory SQLite, failures injected via BEFORE INSERT RAISE(ABORT) triggers (api/test/helpers.ts:16-25 breakAuditInserts/breakTaskInserts), no mocks: (1) audit insert failure rolls back task (tasks=1, audit_events=1 preserved from prior create); (2) task insert failure leaves no ghost audit (0/0); (3) empty-actor CHECK constraint on audit row rolls back both (0/0); (4) 5 creates → exactly one task.created event per task. Result 2026-10-29: `npx vitest run --project api api/test/taskRepository.test.ts -t "task creation audit atomicity"` → 4 passed, 3 skipped (filtered), 1 file passed.

## Notes
Scope: experimentally observed for task CREATION only (POST /api/tasks). Applying the same single-transaction task+audit pattern to future status updates (PATCH /api/tasks/:id/status, not yet implemented) is a RECOMMENDATION, not a ratified rule.

Provenance: Contributed-by: agent — Claude Code (claude-opus-5-5), session on branch recording/salvor-20261028-144909.
Review: unreviewed — hypothesis until a human ratifies it; verify against source and tests before relying on it.

## Verdict
Provisional — awaiting operator ratification via the Brain Audit (RULES §10.3 / §10.5).

## Cross-links
- Registry: `.salvor/domain-learnings/README.md` (chronological index row added by the agent).
- DOMAIN_REF.md: NOT updated — unreviewed knowledge never becomes current truth automatically.
