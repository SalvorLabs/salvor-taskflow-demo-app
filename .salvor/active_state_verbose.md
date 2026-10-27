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
