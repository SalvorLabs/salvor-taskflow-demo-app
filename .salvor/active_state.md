# TaskFlow Active State — (2026-10-30)
## Architecture: npm workspaces api(Fastify/TS/better-sqlite3, :3001) + web(React/Vite/TS, :5173, /api proxy→:3001) + shared(zod schemas)
## Pipeline: web form → POST /api/tasks → validate(shared) → ONE sqlite txn {INSERT tasks; INSERT audit_events} → 201
## DEPLOYED: local only (no external SaaS, no auth; demo actor = repo-local `TASKFLOW_ACTOR`)
## Current Delta to Published Logic: api — GET/POST /api/tasks, PATCH /api/tasks/:id/status (GPT PR#2, merged 6e1c913 into recording branch; NOT main), GET /api/audit-events(?taskId); createTask = db.transaction{INSERT tasks; INSERT audit_events(task.created, actor, ts, meta{requestId uuid, after})} (api/src/taskRepository.ts); seed via same path (actor=seed); updateTaskStatus = db.transaction{SELECT before; UPDATE status+updated_at; INSERT audit_events(task.status_changed, meta{requestId, before.status, after.status})}; 400 bad id/body (strict zod UpdateTaskStatusInputSchema), 404 missing (no audit), 500 rollback; no transition rules (same-status re-audited)
## Tests: npm test → 50 pass (2026-10-30, post-merge; build ok) (vitest projects shared/api/web); atomicity proof = api/test/taskRepository.test.ts "task creation audit atomicity" (SQLite RAISE(ABORT) triggers, no mocks); mutation check: removing create txn fails 3 tests; removing status txn fails 2 (taskStatus.test.ts + taskStatusHttp.test.ts rollback)
## LEARNED FAILURES: none
## web: list(badges, read-only status — UI status control still absent though PATCH now exists)+create form → POST; validateDraft reuses shared schema (web/src/taskView.ts)
## Demo: docs/AMA_DEMO_SCRIPT.md (Claude capture via Salvor MCP → push → ChatGPT GitHub PR). DL:task-mutation-atomic-audit captured on-camera 2026-10-30 (not pre-created)
## DLs (both Review: unreviewed, frozen, NOT in DOMAIN_REF): DL:task-mutation-atomic-audit (Claude, create, 589d60f) ← DL:status-change-atomic-audit-20261030-012241 (GPT-6, status; its "not executed" superseded: Claude ran 50/50 + neg control 2026-10-30). Reconciled here, not in artifacts (README: never edited). Await Brain Audit
## Open: web status control not built; ChatGPT tunnel path unverified here
## Capture: AGENT_CAPTURE=provisional (RULES §10.5) — agent captures land `Review: unreviewed`; DEC only `Review: proposed`
## Last Brain Audit: 2026-10-27 (interval 3d — RULES §10.3)
