# TaskFlow Project History

Salvor project-history log (Core mode — no per-component build counters). Versioning of shipped artifacts is owned
by the repo's established mechanism (the npm `package.json` `version` fields — root `taskflow` and each workspace); this file is a chronological
record of significant changes, not a build-counter manifest.

## History

| Date | Summary |
|------|---------|
| 2026-10-27 | Initial Salvor scaffold. Hub-and-spoke CLAUDE.md, L1/L2 cache, RULES.md §0–§10 (strict defaults DISABLED), DEFERRED_TODOS, domain-learnings + postmortems scaffolds. |
| 2026-10-27 | Baseline api + shared: Fastify `GET/POST /api/tasks`, `GET /api/audit-events`, SQLite `tasks` + `audit_events` (migration `001_create_tasks_and_audit_events`), task+audit written in one transaction, seed rows, Vitest suites on real SQLite. `PATCH /api/tasks/:id/status` intentionally not implemented. |
| 2026-10-27 | Web UI (React/Vite): task list with status badges + create form validated by the shared schema; pure UI logic in `web/src/taskView.ts` with Vitest tests. README with run/test/verify steps, `verify:audit` and opt-in `demo:reset-db` scripts. |
