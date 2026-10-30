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

## 2026-10-27 — web UI + docs
- `web/src/App.tsx` (list + create form), `web/src/api.ts` (fetch client), `web/src/taskView.ts` (validateDraft via
  `CreateTaskInputSchema`, countByStatus, sortTasks, insertTask, formatCreatedAt — 7 unit tests). Status is shown as
  a badge only; footer says status changes are not supported yet, so the UI does not imply the PATCH feature exists.
- Verified in a browser via the Playwright MCP (capture only — Playwright is NOT a project dependency): seeded list
  rendered, form create → task #5 at top, counts updated; screenshot `docs/screenshots/taskflow.png`.
- Scripts: `npm run verify:audit` (curl + sqlite3), `npm run demo:reset-db -- --yes` (deletes only
  `api/data/taskflow.db*`; refuses while the API runs).

## 2026-10-27 — AMA demo run-sheet
- `docs/AMA_DEMO_SCRIPT.md`: on-camera prompts (Claude: locate txn → run atomicity tests → zero-credit MCP capture
  attempt → `salvor deposit` → retry capture as `Review: unreviewed` → `salvor agentic-capture-review` → commit with
  `Salvor-Contribution: agent` + push; ChatGPT: MCP search/fetch → independent GitHub source check → branch
  `chatgpt/task-status-audit` → PATCH /api/tasks/:id/status with `task.status_changed` audit in one txn + tests → PR
  citing the DL as provisional; stretch: GPT DL on branch, merge, Claude pull + reconcile prompt, no ratification).
- Reset checklist is opt-in: `npm run demo:reset-db -- --yes`; rehearsal captures are undone with `git revert`, never
  reset/force-push; billing ledger never reset from this repo.
- Dependencies on `salvor-mcp` (empty repo at build time) are listed in the script; tool names deliberately not
  hard-coded in prompts. The capture was NOT pre-populated.

## 2026-10-30 — Cross-vendor handoff: capture → GPT PR → verify → merge → reconcile
- Claude capture: first `salvor_capture_learning` call → INSUFFICIENT_CREDITS (need 5, have 0; nothing written, no
  bypass). After funding (1000 credits) → `DL:task-mutation-atomic-audit`, Review: unreviewed, 5 debited (1000→995,
  ledger 28775b0c-…). Committed 589d60f (trailer `Salvor-Contribution: agent`, unsigned) + pushed to recording branch.
  Note: `origin` URL `SalvorLabs/demo-app` redirects to `SalvorLabs/salvor-taskflow-demo-app`.
- GPT PR #2 (`chatgpt/status-audit-20261030-012241` → recording branch, head 8d1d865, 9 commits): PATCH
  /api/tasks/:id/status, `UpdateTaskStatusInputSchema` (strict, `{status}` only), `updateTaskStatusTx` in one
  `db.transaction`, tests `api/test/taskStatus.test.ts` (4) + `api/test/taskStatusHttp.test.ts` (14), GPT DL. GPT ran no
  tests (stated in PR).
- Claude verification on PR head: `npm test` 50/50 (7 files), `npm run build` exit 0. Negative control: replaced
  `db.transaction(` with identity in `updateTaskStatusTx` → exactly 2 fail (repo rollback + HTTP 500 rollback),
  37 pass; restored via `git checkout`, 39/39 api pass. No corrections needed.
- Merge: PR was draft → merge refused; operator approved `gh pr ready` → `gh pr merge --merge --match-head-commit`
  → merge commit 6e1c913 on recording branch (main untouched at 6bacecf). Pulled ff; post-merge 50/50 + build ok.
  GitNexus re-indexed (`analyze --index-only`: 218 nodes / 347 edges / 13 clusters / 5 flows).
- Reconciliation: domain-learnings are frozen receipts (README), so neither artifact was edited. Relationship: Claude
  DL = creation evidence + recommendation for status updates; GPT DL = status-update implementation that follows that
  recommendation, explicitly cites Claude DL as prior art. GPT DL's "tests not executed" caveat is now superseded by the
  run above. Both remain Review: unreviewed with original Contributed-by (Claude: `claude-code/2.1.314`; GPT:
  `OpenAI ChatGPT / GPT-6`). No ratification; DOMAIN_REF unchanged; ratification belongs to Brain Audit.
- Open: same-status PATCH still writes an audit event (no transition rules) — design question for ratification.
