# web — TaskFlow UI

React 18 + Vite + TypeScript single page. Talks only to the api via relative `/api/*` (Vite dev proxy → :3001).

## Key Files
- `src/main.tsx` — React entry
- `src/App.tsx` — task list + create form
- `src/api.ts` — typed fetch client for `/api/tasks`
- `src/taskView.ts` — pure UI business logic (form validation, grouping/sorting, labels) — unit tested
- `test/` — Vitest unit tests for pure logic (no Playwright / browser automation)

## Architecture Notes
- Status is display-only: the UI must not offer a status-change control until `PATCH /api/tasks/:id/status` exists.
- Validation reuses `@taskflow/shared` schemas so form and API agree.

## Build
- `npm run build -w web` (tsc + vite build → `web/dist/`); `npm test -w web`.

For codebase tree: use Serena MCP `get_symbols_overview`.
For domain logic: see `.salvor/DOMAIN_REF.md`. For infra/ops: see `.salvor/INFRA.md`.
