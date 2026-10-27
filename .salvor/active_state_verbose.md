# TaskFlow Active State — VERBOSE ARCHIVE

L2 cache. Detailed but CURATED deep history of reasoning, rejected hypotheses, and condensed evidence pruned from L1.
Update trigger: immediately after every L1 update. Summarize command output — keep evidence, conclusions, and
commit/test/issue IDs, not raw dumps. Rotation: when this file exceeds ~1,500 lines, or at each release milestone,
condense the oldest resolved sections into brief summaries (keep durable conclusions, drop noise). Never persist
secrets, credentials, PII, or unredacted logs here (RULES §9) — redact before writing.

---

## 2026-10-27 — Project initialized
Initial Salvor scaffold: hub-and-spoke CLAUDE.md, L1/L2 cache, RULES.md §0–§10 (strict defaults DISABLED), three
capture classes. Versioning owned by the minimal Salvor project-history file (`VERSION.md`, "TaskFlow Project
History") — no per-component build counters scaffolded.

Setup answers (operator pre-approved): project name TaskFlow; components api (Fastify/TS/SQLite), web (React/Vite/TS),
shared (small TS schemas — included because api validation and the web form share one task schema); paired-path parity
none; Optional Strict Engineering Defaults NO. Operator set `AGENT_CAPTURE = provisional` (RULES §10.5).
Source protocol: SalvorLabs/Salvor `SETUP_PROMPT.md` @ 9140ea9 (Protocol v1.0.0-beta), identical to the local checkout.

Tooling (Step 0.3, checked separately): Serena — CLI present, `.serena/` already initialized by the client, MCP
configured (user scope), MCP responded (`initial_instructions`, `check_onboarding_performed`) → ENHANCED-ACTIVE.
GitNexus — CLI v1.6.9, `--index-only` supported, MCP configured (user scope), MCP responded (`list_repos`); no index yet
(repo had no commits) → index built in pure index mode after the scaffold commit.

Demo intent: the baseline ships GET/POST /api/tasks with an atomic task+audit transaction and a rollback test. The
PATCH /api/tasks/:id/status endpoint is intentionally left unimplemented for the ChatGPT Web leg, and the on-camera
Domain Learning (`DL:task-mutation-atomic-audit`) is intentionally NOT pre-created — it is captured live via the Salvor MCP.

## 2026-10-27 — api + shared baseline
- Stack: npm workspaces (`shared`, `api`, `web`), TypeScript ESM, Fastify 5, better-sqlite3 12, zod 3, Vitest 3 (root
  `vitest.config.ts` `projects`). api runs from TS via `tsx`; `npm run build` type-checks api/shared and builds web.
- Atomicity: `createTaskRepository().createTask` wraps the `tasks` INSERT and the `audit_events` INSERT in one
  `db.transaction`. better-sqlite3 rolls back on any throw, so an audit failure removes the task and a task failure
  never reaches the audit insert. DB-level guards: CHECKs on status/title/actor, `json_valid(metadata)`, FK to tasks.
- Evidence: `api/test/taskRepository.test.ts` › "task creation audit atomicity" (4 tests) and `api/test/app.test.ts`
  › "returns 500 and persists neither row when the audit insert fails". Failures are injected with real SQLite
  `RAISE(ABORT)` triggers on `:memory:` DBs (helpers in `api/test/helpers.ts`), not mocks. Negative control: replacing
  `db.transaction(` with an identity wrapper made 3 of those tests fail; restored → all pass.
- Request ids switched to `randomUUID()` (Fastify default `req-N` repeats across restarts, weak for audit correlation).
- Live smoke (scratch DB, port 3011): POST → 201, audit row `task.created` actor `demo-operator`, PATCH
  `/api/tasks/1/status` → 404 (intentionally unimplemented).
