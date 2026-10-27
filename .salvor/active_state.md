# TaskFlow Active State — (2026-10-27)
## Architecture: npm workspaces api(Fastify/TS/better-sqlite3, :3001) + web(React/Vite/TS, :5173, /api proxy→:3001) + shared(zod schemas) — app code pending
## Pipeline: web form → POST /api/tasks → validate(shared) → ONE sqlite txn {INSERT tasks; INSERT audit_events} → 201
## DEPLOYED: local only (no external SaaS, no auth; demo actor = repo-local `TASKFLOW_ACTOR`)
## Current Delta to Published Logic: none — Salvor scaffold only
## LEARNED FAILURES: none
## Open: build baseline (GET/POST /api/tasks + atomic audit + tests + UI); PATCH /api/tasks/:id/status intentionally UNIMPLEMENTED (ChatGPT demo deliverable)
## Capture: AGENT_CAPTURE=provisional (RULES §10.5) — agent captures land `Review: unreviewed`; DEC only `Review: proposed`
## Last Brain Audit: 2026-10-27 (interval 3d — RULES §10.3)
