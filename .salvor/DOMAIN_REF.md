# TaskFlow Domain Reference

Authoritative current-truth for domain logic. Artifacts in `.salvor/domain-learnings/` are frozen audit trails; this file is
what's currently true.

## Sections
- **Task** — `id`, `title` (required, 1–200 chars), `description` (optional, ≤2000), `status`
  (`todo` | `in_progress` | `completed`), `createdAt`, `updatedAt`. Schema owner: `shared/src/task.ts` (once landed).
- **Audit event** — one `audit_events` row per successful task mutation: `action` (e.g. `task.created`), `task_id`,
  `actor`, `created_at`, JSON `metadata`. Actor is the repo-local demo actor (`TASKFLOW_ACTOR`, default `demo-operator`);
  there is no authentication.
- **Mutations implemented:** create (`POST /api/tasks`). **Not implemented:** status change
  (`PATCH /api/tasks/:id/status`) — planned future feature.

## Learned Failures (LF:)
[One entry per failure mode, headed `### LF:<kebab-slug> (YYYY-MM-DD)`, opening with the structured header — Subject /
Claim / Evidence date / Status (RULES §10.1) — then root cause, fix sites, and a cross-link to the dated artifact in
`.salvor/domain-learnings/`. Update existing entries when a v1 fix is upgraded to v2 (RULES §6.9). Never two
contradictory `Status: live` entries — resolve per RULES §10.4.]
