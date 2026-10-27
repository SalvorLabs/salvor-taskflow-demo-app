# api — TaskFlow REST API

Fastify 5 + TypeScript (ESM, run via `tsx`), SQLite via `better-sqlite3` (synchronous, so a whole mutation runs inside
one `db.transaction(...)`). Entry point `src/server.ts`. No external systems; no auth (demo actor from `TASKFLOW_ACTOR`).

## Key Files
- `src/server.ts` — process entry: open DB, migrate, seed, listen
- `src/app.ts` — `buildApp()` Fastify factory + routes (`GET /api/tasks`, `POST /api/tasks`)
- `src/db.ts` — connection + versioned migrations (`tasks`, `audit_events`)
- `src/taskRepository.ts` — task reads/writes; owns the task+audit transaction
- `src/seed.ts` — sample rows for an empty database
- `test/` — Vitest, real in-memory SQLite (`:memory:`), no DB mocks

## Architecture Notes
- Every task mutation writes its `audit_events` row in the SAME SQLite transaction as the task write; an audit
  failure rolls the task back. See `.salvor/DOMAIN_REF.md`.
- `PATCH /api/tasks/:id/status` is intentionally NOT implemented (future feature / demo deliverable).
- Request/response shapes come from `@taskflow/shared` (zod); do not redefine them here.

## Build
- `npm run build -w api` (tsc type-check only — the api runs from TS source via `tsx`); `npm test -w api`.

For codebase tree: use Serena MCP `get_symbols_overview`.
For domain logic: see `.salvor/DOMAIN_REF.md`. For infra/ops: see `.salvor/INFRA.md`.
