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
