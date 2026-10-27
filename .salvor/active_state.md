# TaskFlow Active State — (2026-10-27)
## Architecture: npm workspaces api(Fastify/TS/better-sqlite3, :3001) + web(React/Vite/TS, :5173, /api proxy→:3001) + shared(zod schemas)
## Pipeline: web form → POST /api/tasks → validate(shared) → ONE sqlite txn {INSERT tasks; INSERT audit_events} → 201
## DEPLOYED: local only (no external SaaS, no auth; demo actor = repo-local `TASKFLOW_ACTOR`)
## Current Delta to Published Logic: api baseline landed — GET/POST /api/tasks, GET /api/audit-events(?taskId); createTask = db.transaction{INSERT tasks; INSERT audit_events(task.created, actor, ts, meta{requestId uuid, after})} (api/src/taskRepository.ts); seed via same path (actor=seed)
## Tests: npm test → 32 pass (vitest projects shared/api/web); atomicity proof = api/test/taskRepository.test.ts "task creation audit atomicity" (SQLite RAISE(ABORT) triggers, no mocks); mutation check: removing txn fails 3 tests
## LEARNED FAILURES: none
## web: list(badges, read-only status)+create form → POST; validateDraft reuses shared schema (web/src/taskView.ts)
## Demo: docs/AMA_DEMO_SCRIPT.md (Claude capture via Salvor MCP → push → ChatGPT GitHub PR). DL:task-mutation-atomic-audit NOT pre-created — on-camera only
## Open: salvor-mcp deps unverified here (MCP server/tools, INSUFFICIENT_CREDITS, salvor CLI, ChatGPT tunnel); PATCH /api/tasks/:id/status intentionally UNIMPLEMENTED (ChatGPT demo deliverable)
## Capture: AGENT_CAPTURE=provisional (RULES §10.5) — agent captures land `Review: unreviewed`; DEC only `Review: proposed`
## Last Brain Audit: 2026-10-27 (interval 3d — RULES §10.3)
