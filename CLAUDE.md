# TaskFlow
### CURRENT STATE (L1 Cache)
@.salvor/active_state.md

> For deep historical context, architecture logs, or context recovery: `.salvor/active_state_verbose.md`

## Project Overview
TaskFlow is a deliberately small task manager used as the Salvor AMA cross-vendor demo: a Fastify/TypeScript REST
API persisting tasks and audit events in SQLite, and a React/Vite web UI. It integrates with no external SaaS. The
dominant non-obvious constraint: every task mutation and its `audit_events` row are written in ONE SQLite transaction —
a task never exists without its audit record and a rolled-back mutation never leaves a ghost audit event.

## Architecture

| Component | Stack | Spoke |
|-----------|-------|-------|
| api | Fastify / TypeScript / SQLite (better-sqlite3) | @api/CLAUDE.md |
| web | React / Vite / TypeScript | @web/CLAUDE.md |
| shared | TypeScript schemas (zod) shared by api + web | @shared/CLAUDE.md |

## Documentation Map

| Document | Purpose | When to Read |
|----------|---------|-------------|
| `.salvor/DOMAIN_REF.md` | Domain logic, business rules, learned failures | Changing core logic |
| `.salvor/INFRA.md` | Running, env vars, deployment, external APIs | Changing infra/deployment/APIs |
| `.salvor/DEFERRED_TODOS.md` | Deferred findings (out-of-scope, not yet fixed) | Before starting related work |
| `.salvor/decisions/` | Design decisions + load-bearing invariants (why it's this way, what must stay) | Before changing/refactoring anything non-trivial |
| `.salvor/domain-learnings/` | Dated empirical findings (incl. `Review: unreviewed` agent captures) | Before changing related behavior |
| `api/CLAUDE.md` | api architecture and key files | Working in api/ |
| `web/CLAUDE.md` | web architecture and key files | Working in web/ |
| `shared/CLAUDE.md` | shared schema package | Working in shared/ |
| `.serena/memories/` | enhanced mode: retrieval pointers into `.salvor/` (concise summaries only) | Use Serena MCP tools to query |

### SYSTEM DIRECTIVE: TWO-TIER MEMORY MANAGEMENT
You maintain two memory ledgers: `.salvor/active_state.md` (L1 Cache — Concise) and `.salvor/active_state_verbose.md`
(L2 Cache — Deep Memory).

**L1 — active_state.md (Concise)**
- **Role:** Primary context for every session. Auto-loaded via `@` import (Claude Code) or read first (other CLIs).
- **Content:** Final confirmed logic, active deltas vs published behavior, infra status, and "Learned Failures."
- **Constraints:** MAXIMUM 50 LINES. Dense technical shorthand; non-standard abbreviations optimal for token density.
- **Update Trigger:** After every confirmed resolution, milestone, or architectural shift.

**L2 — active_state_verbose.md (Deep Archive)**
- **Role:** Curated repository for reasoning, condensed logs, evidence, and rejected hypotheses.
- **Update Trigger:** Immediately after updating L1 — offload the nuance pruned from L1.
- **Constraint:** Detailed but CURATED, never a raw dump — summarize command output; keep evidence, conclusions, and
  commit/test/issue IDs. Rotate: past ~1,500 lines, or at each release milestone, condense the oldest resolved sections
  into brief summaries (keep durable conclusions, drop noise). Do NOT read unless explicitly instructed or during
  Context Recovery (RULES §1).

**Execution Rules:**
- Routine L1/L2 operational-state maintenance is automatic — do not ask permission for these writes. Salvor may update
  concise operational state as work progresses. It must ask before promoting a decision, domain learning, learned
  failure, or deferred finding into the repository's durable shared engineering record.
- On any major learning or infra nuance: update L1 instantly with shorthand and L2 with detail.
- NEVER persist secrets, credentials, PII, or unredacted logs to any memory file (RULES §9). Redact before writing.

### SYSTEM DIRECTIVE: THREE CAPTURE CLASSES (user-gated)
You self-identify knowledge worth persisting durably and ask me, verbatim, before persisting it. Three capture classes
(see `RULES.md` §2 and §7):
1. **Decision / Domain Learning** — a discovery, decision, or design invariant + its *why*. Two subtypes: for a
   deliberate **Design Decision or load-bearing invariant**, ask `"Record this as a design decision? (yes/no)"` →
   `.salvor/decisions/` (with its Invariant & Coupling); for an empirical **Domain Learning**, ask
   `"Save this as a domain learning? (yes/no)"` → `.salvor/domain-learnings/`.
2. **Learned Failure (`LF:<slug>`)** (a structural failure mode) → registered in `.salvor/DOMAIN_REF.md` as part of the above.
3. **Deferred Finding** (an out-of-scope finding surfaced mid-task) → `"Log this to .salvor/DEFERRED_TODOS.md? (yes/no)"`

This repo sets `AGENT_CAPTURE = provisional` (RULES §10.5): agents MAY capture Domain Learnings, Learned Failures and
Deferred Findings without the per-item gate, but only as `Review: unreviewed` with `Contributed-by: agent — …`
provenance and the `Salvor-Contribution: agent` commit trailer; Design Decisions only as `Review: proposed`.
Unreviewed knowledge is hypothesis, not invariant — verify it against source and tests before acting on it.

### GitNexus — Code Intelligence (enhanced mode only; hand-authored, thin)
- Pure index mode only (`gitnexus analyze --index-only`; `.gitnexusrc` `{"indexOnly": true}`) — GitNexus writes no
  blocks into these instruction files.
- Before editing a symbol, run GitNexus impact analysis and report the blast radius; run change-detection before commit.
- Trace callers / execution flows with the knowledge graph instead of grepping. Re-index after structural changes.
