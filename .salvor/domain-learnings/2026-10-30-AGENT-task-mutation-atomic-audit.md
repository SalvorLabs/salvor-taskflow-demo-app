# 2026-10-30 — AGENT — Task mutations must preserve the audit trail atomically

- **ID:** DL:task-mutation-atomic-audit
- **Subject:** api, sqlite, audit_events
- **Claim:** Task writes must preserve audit consistency atomically so a failed audit write cannot leave an untracked task mutation. Observed experimentally for task creation only; applying it to future status updates is a recommendation, not a ratified rule.
- **Evidence date:** 2026-10-30
- **Status:** live
- **Contributed-by:** agent — claude-code/2.1.314, 2026-10-30
- **Review:** unreviewed

**Category:** AGENT (provisional domain learning)

> **Review: unreviewed** — hypothesis, not invariant (RULES §10.5). Cite this provenance when acting on it;
> it never relaxes a rule and never overrides ratified knowledge.

## Hypothesis
Task writes must preserve audit consistency atomically so a failed audit write cannot leave an untracked task mutation. Observed experimentally for task creation only; applying it to future status updates is a recommendation, not a ratified rule.

## Evidence
Source: api/src/taskRepository.ts:77-92 — createTaskTx = db.transaction(...) runs insertTask.run (L79) then insertAudit.run with action 'task.created', actor, createdAt, metadata {requestId, after} (L81-90) in one better-sqlite3 transaction; a throw from either INSERT rolls back both. Route api/src/app.ts:30 (POST /api/tasks) calls repo.createTask. Tests: api/test/taskRepository.test.ts:49 describe('task creation audit atomicity'), real in-memory SQLite, failures injected via BEFORE INSERT RAISE(ABORT) triggers (api/test/helpers.ts:16-25): (1) audit insert fails -> new task rolled back, tasks=1/audit_events=1 unchanged; (2) task insert fails -> tasks=0/audit_events=0, no ghost audit row; (3) empty actor violates audit CHECK constraint -> tasks=0/audit_events=0; (4) 5 creates -> exactly one task.created event per task. Run 2026-10-30 (rechecked before capture, source unchanged, clean tree): `npx vitest run --project api api/test/taskRepository.test.ts -t "task creation audit atomicity"` -> 4 passed, 3 skipped. Not verified: HTTP-level 500 on rollback; no other mutation endpoints exist yet.

## Scope
Experimentally observed for task creation only (POST /api/tasks). Using this for future status updates (the unimplemented PATCH /api/tasks/:id/status) is a recommendation, NOT a ratified rule.

## Recommendation for future mutations
- Write the task change and its audit_events row inside one db.transaction(...).
- Copy the 'task creation audit atomicity' test pattern: inject a failure with a RAISE(ABORT) trigger and assert both table counts are unchanged.

## Provenance
Contributed-by: agent — Claude Code (claude-opus-5-5), 2026-10-30, from a read-only investigation plus test run in this repo. Review: unreviewed — hypothesis until a human ratifies it; verify against source and tests before relying on it.

## Verdict
Provisional — awaiting operator ratification via the Brain Audit (RULES §10.3 / §10.5).

## Cross-links
- Registry: `.salvor/domain-learnings/README.md` (chronological index row added by the agent).
- DOMAIN_REF.md: NOT updated — unreviewed knowledge never becomes current truth automatically.
