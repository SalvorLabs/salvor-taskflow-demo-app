# Domain Learnings

Frozen audit trail of every domain discovery, hypothesis test, vendor probe, and learned failure. Each artifact is dated,
categorized, and never edited after creation (DOMAIN_REF.md carries the living truth; these are the receipts).

## Naming convention
`YYYY-MM-DD-[CATEGORY]-[OUTCOME].md` — artifact ID `DL:<kebab-slug>` (or `LF:<kebab-slug>` for a Learned Failure
spec; RULES §10.1)

Categories (extend as needed):
- `PROBE` — exploration of an external system / vendor with a verdict
- `BAKEOFF` — A/B/N test of competing approaches with a verdict
- `LF` — Learned Failure spec with root cause + fix (carries the `LF:<slug>` ID registered in DOMAIN_REF)
- `ARCH` — empirical architecture probe with evidence and a verdict
- `MIGRATION` — pre-spec for a non-trivial change

## What goes here
- Structured header first: ID / Subject / Claim / Evidence date / Status (RULES §10.1)
- Hypothesis stated up front, in one sentence
- Evidence: what was tested, observed, what the data says
- Verdict: accepted / falsified / inconclusive
- Cross-links: spec → code commit → L1/L2 entries it updated

## Provisional (agent) captures — `AGENT_CAPTURE = provisional` (RULES §10.5)
An agent-authored artifact adds two lines to the structured header, directly after **Status**:
`Contributed-by: agent — <vendor/model>, <date>` and `Review: unreviewed`. It is hypothesis, not invariant, until the
operator ratifies it through the Brain Audit gate. The commit that introduces it carries the trailer
`Salvor-Contribution: agent`. Human-gated captures carry `Contributed-by: operator-approved` and no `Review:` field.

## Chronological index
<!-- no entries yet — add one row per artifact, newest last -->
| Date | ID | File | Category | Subject | One-line takeaway |
|------|----|------|----------|---------|-------------------|
| 2026-10-30 | DL:task-mutation-atomic-audit | [2026-10-30-AGENT-task-mutation-atomic-audit.md](2026-10-30-AGENT-task-mutation-atomic-audit.md) | AGENT | api, sqlite, audit_events | Task writes must preserve audit consistency atomically so a failed audit write cannot leave an untracked task mutation. Observed experimentally for task creation only; applying it to future status updates is a recommendation, not a ratified rule. (unreviewed) |
| 2026-10-30 | DL:status-change-atomic-audit-20261030-012241 | [2026-10-30-AGENT-status-change-atomic-audit-20261030-012241.md](2026-10-30-AGENT-status-change-atomic-audit-20261030-012241.md) | AGENT | api, sqlite, status changes, audit_events | GPT-6 implemented transactional task.status_changed audit with repository and HTTP rollback tests; not executed or ratified (unreviewed). |
