# TaskFlow Infrastructure

Operational reference: running locally, deployment, env vars, external APIs, observability.

## Local
- Node 22 / npm 10, npm workspaces (`api`, `web`, `shared`). `npm install` at the root, then `npm run dev`.
- api: Fastify on `http://localhost:3001` (`PORT`); web: Vite on `http://localhost:5173`, proxying `/api` → api.
- SQLite file: `api/data/taskflow.db` (gitignored; created + migrated + seeded on first start). Tests use `:memory:`.

## Deployment
Local only — no deployment target for the demo.

## Env vars
| Var | Component | Default | Purpose |
|-----|-----------|---------|---------|
| `PORT` | api | `3001` | HTTP port |
| `TASKFLOW_DB_PATH` | api | `api/data/taskflow.db` | SQLite file path (`:memory:` allowed) |
| `TASKFLOW_ACTOR` | api | `demo-operator` | Actor written to `audit_events.actor` (demo stand-in for auth) |
| `TASKFLOW_SEED` | api | `true` | Seed sample tasks into an empty database |

## External APIs
None. The Salvor MCP (knowledge capture/billing) is an operator tool used by agents, not an app dependency; it is
owned by the separate `SalvorLabs/salvor-mcp` repository.

## Observability
Fastify request logs to stdout; `audit_events` table is the mutation audit trail.
