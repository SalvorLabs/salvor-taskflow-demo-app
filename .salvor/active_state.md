# TaskFlow Active State — (2026-10-27)
## Architecture: npm workspaces api(Fastify/TS/better-sqlite3, :3001) + web(React/Vite/TS, :5173, /api proxy→:3001) + shared(zod schemas)
## Pipeline: web form → POST /api/tasks → validate(shared) → ONE sqlite txn {INSERT tasks; INSERT audit_events} → 201
## DEPLOYED: local only (no external SaaS, no auth; demo actor = repo-local `TASKFLOW_ACTOR`)
## Current Delta to Published Logic: api baseline landed — GET/POST /api/tasks, GET /api/audit-events(?taskId); createTask = db.transaction{INSERT tasks; INSERT audit_events(task.created, actor, ts, meta{requestId uuid, after})} (api/src/taskRepository.ts); seed via same path (actor=seed)
## Tests: npm test → 54 pass (vitest projects shared/api/web); atomicity proofs = api/test/taskRepository.test.ts "task creation audit atomicity" + api/test/taskStatus.test.ts (GPT-authored; executed locally 2026-10-27 on rehearsal/salvor-handoff, 14 pass) — SQLite RAISE(ABORT) triggers, no mocks
## LEARNED FAILURES: none
## web: list(badges, read-only status)+create form → POST; validateDraft reuses shared schema (web/src/taskView.ts)
## Demo: docs/AMA_DEMO_SCRIPT.md (Claude capture via Salvor MCP → push → ChatGPT GitHub PR). DL:task-mutation-atomic-audit NOT pre-created — on-camera only
## Rehearsal (branch rehearsal/salvor-handoff ONLY, main untouched): PR #1 (ChatGPT) merged 1c9643e → PATCH /api/tasks/:id/status = db.transaction{UPDATE tasks; INSERT audit_events(task.status_changed, before/after, requestId)}; 404 unknown task, 400 bad id/payload (strict zod), 500 + rollback on audit failure — re-verified by Claude (npm test 54/54, build ok, 21 independent checks)
## Knowledge: 2 provisional DLs, both `Review: unreviewed` (hypotheses, NOT ratified): DL:task-mutation-atomic-audit (claude-code) + DL:status-change-atomic-audit-rehearsal (ChatGPT/GPT-6); visible in salvor agentic-capture-review + MCP search/fetch; DOMAIN_REF not promoted
## Open: PATCH /api/tasks/:id/status exists on the rehearsal branch only (main still intentionally unimplemented); ratification of both DLs pending Brain Audit
## Capture: AGENT_CAPTURE=provisional (RULES §10.5) — agent captures land `Review: unreviewed`; DEC only `Review: proposed`
## Last Brain Audit: 2026-10-27 (interval 3d — RULES §10.3)
