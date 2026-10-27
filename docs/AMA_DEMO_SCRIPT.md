# TaskFlow AMA demo script — Claude Code → ChatGPT Web, via GitHub

Operator run-sheet for Camtasia. It shows one piece of engineering knowledge, captured from real code and
tests in Claude Code, being found and checked by ChatGPT Web, which then builds the missing feature on
GitHub.

> **Do not pre-create the knowledge artifact.** The Domain Learning (`DL:task-mutation-atomic-audit`)
> must be written on camera by Claude Code through the Salvor MCP, after Claude has looked at the
> evidence. Before you record, `.salvor/domain-learnings/` should hold only `README.md`, and its index
> table should be empty. Check this with the pre-flight below.

## Who does what, and where

| Actor | Reads | Writes | Where the effect shows |
|---|---|---|---|
| **Claude Code CLI** (IntelliJ terminal, operator's Mac) | local checkout | local files → `git push` to `SalvorLabs/demo-app` | `.salvor/domain-learnings/…`, `salvor agentic-capture-review`, GitHub `main` |
| **Salvor MCP** (local, Docker, bound to this checkout) | `.salvor/` in the **local working tree** | the capture artifact (for Claude, credit-gated) | local files; billing ledger (owned by `salvor-mcp`) |
| **ChatGPT Web** + **Salvor MCP (read-only, tunneled)** | the same local `.salvor/` via the tunnel | nothing; the web MCP is read-only | the GPT chat transcript |
| **ChatGPT Web** + **GitHub integration** | `SalvorLabs/demo-app` **on GitHub** | branch `chatgpt/task-status-audit`, PR | GitHub branch, PR diff, checks |

Two consequences to state on camera:

1. ChatGPT **cannot edit files on the Mac**. It changes code only through its GitHub integration, on a
   branch, in a PR.
2. The Salvor MCP sees the **local working tree**, but GitHub sees only what has been **pushed**. Claude
   must commit and push the capture so ChatGPT's GitHub view and its Salvor MCP view agree. A local-only
   capture would be visible to GPT's MCP but missing from the repo GPT edits.

## What this script depends on from `salvor-mcp`

This repo does not implement any of these. They come from the separate `SalvorLabs/salvor-mcp` session
and were not available when this baseline was built (that repo had no commits yet), so confirm each one
in a rehearsal:

- The Salvor MCP server, registered in Claude Code (e.g. via `.mcp.json` or `claude mcp add`). This repo
  ships no MCP config, so use whatever the `salvor-mcp` README specifies. It must run in Docker with this
  checkout bind-mounted.
- A capture tool that is credit-gated and returns `INSUFFICIENT_CREDITS` with "Run salvor deposit".
- The `salvor account`, `salvor deposit`, and `salvor agentic-capture-review` CLI commands. Their exact
  output format and fields are owned there.
- Search and fetch tools on the read-only, tunneled endpoint for the ChatGPT custom connector.
- The artifact filename and header the MCP writes. It should match `.salvor/domain-learnings/README.md`
  (structured header plus `Contributed-by` / `Review: unreviewed`).

The prompts below refer to "the Salvor MCP tool" rather than exact tool names, so they still work if
the names change.

## Pre-flight (before every take)

```bash
cd /Users/dwasyluk/Development/SALVORLABS/demo-app
git checkout main && git pull --ff-only
git status --short                       # expect: clean
ls .salvor/domain-learnings/             # expect: README.md only
grep -c '^| 20' .salvor/domain-learnings/README.md   # expect: 0 (no index rows)
git ls-remote --heads origin chatgpt/task-status-audit   # expect: no output
npm install && npm test                  # expect: 32 passed
npm run dev                              # UI http://localhost:5173, API :3001
```

On the Salvor side (owned by the `salvor-mcp` session, so follow its reset notes):

- The Salvor MCP container is running against this checkout, and Claude Code lists the Salvor tools
  (`/mcp` in Claude Code).
- The demo account shows **zero credits** (`salvor account`).
- The wallet you will deposit from is funded.
- The ChatGPT custom connector (tunneled, read-only) is connected and lists the Salvor tools.

Optional: open these tabs before you record.
- `http://localhost:5173` (UI)
- `http://127.0.0.1:3001/api/audit-events` (raw audit trail)
- `https://github.com/SalvorLabs/demo-app` (code, then the PR)

---

## Part 1 — Claude Code (IntelliJ terminal)

Start a fresh `claude` session at the repo root. Salvor loads automatically through `CLAUDE.md`.

### 1.1 Find the audit transaction

**Prompt:**

> Where does POST /api/tasks write the task and its audit event? Show me the exact code that makes them
> atomic, and tell me what happens if the audit insert fails.

**Expected:** Claude follows `api/src/app.ts:20` (route) to `api/src/taskRepository.ts:77`
(`createTaskTx = db.transaction(...)`), with the `tasks` INSERT followed by the `audit_events` INSERT
(`action: 'task.created'`, line 81). It explains that better-sqlite3 rolls back the whole transaction on
any throw.

### 1.2 Run the proof test

**Prompt:**

> Run the atomicity tests and show me the result. Then explain how the test makes the audit insert fail
> without mocking the database.

**Expected command:** `npx vitest run --project api -t "atomicity"` (or `npm test`).
**Expected result:** the four tests in `api/test/taskRepository.test.ts:49` ›
"task creation audit atomicity" pass:

- `rolls back the task when the audit insert fails`
- `never leaves a ghost audit event when the task insert fails`
- `rolls back when the audit row violates a constraint (empty actor)`
- `keeps one audit event per task across many creates`

The HTTP-level counterpart is `api/test/app.test.ts:109` › "returns 500 and persists neither row when
the audit insert fails". Failures come from real SQLite `RAISE(ABORT)` triggers on an in-memory DB
(`api/test/helpers.ts`), not from mocks.

*Optional live proof, a single curl, if you want the interviewer to see a row land:*
`npm run verify:audit` prints the new task, its `task.created` audit row from the API, and the same rows
from `sqlite3`.

### 1.3 Attempt the capture with zero credits

Show the balance in a second terminal first:

```bash
salvor account          # expect: 0 credits
```

**Prompt (exact):**

> Use the Salvor MCP tool to capture this as a Domain Learning: "Task mutations must preserve the audit
> trail atomically." Use the ID DL:task-mutation-atomic-audit. Cite the evidence you just inspected: the
> transaction in api/src/taskRepository.ts and the "task creation audit atomicity" tests in
> api/test/taskRepository.test.ts. This is an agent capture, so it is Review: unreviewed. Do not write the
> file yourself. If the MCP refuses, show me the refusal and stop.

**Expected:** the Salvor MCP returns a real `INSUFFICIENT_CREDITS` error telling you to
`Run salvor deposit`. Claude reports it and **does not** fall back to writing the file directly. If Claude
offers to write the file by hand, decline on camera: "No, the capture has to go through the MCP."

### 1.4 Top up

In the second terminal:

```bash
salvor deposit          # follow the prompts; send real $SALVOR from the demo wallet
salvor account          # expect: credited balance after billing verifies the deposit
```

Deposit verification and crediting are implemented by `salvor-mcp`, not this repo.

### 1.5 Retry the capture

**Prompt (exact):**

> Credits are topped up. Re-check the code and tests first so the evidence is current: confirm the
> transaction is still in api/src/taskRepository.ts and re-run the atomicity tests. Then retry the Salvor
> MCP capture of DL:task-mutation-atomic-audit as an unreviewed agent Domain Learning, with provenance
> and the evidence (file paths, test names, the test result you just saw). State its scope: it was observed
> for task creation only. The implication for future work, such as a status-change endpoint, is a
> recommendation, not a ratified rule. Then show me the artifact and the index row.

**Expected on disk** (the MCP chooses the final filename; the canonical form is
`.salvor/domain-learnings/YYYY-MM-DD-[CATEGORY]-[OUTCOME].md`, e.g. `…-ARCH-TASK_MUTATION_ATOMIC_AUDIT.md`):

- New file in `.salvor/domain-learnings/` whose structured header has:
  - `ID: DL:task-mutation-atomic-audit`
  - `Subject:` tags (e.g. `api, sqlite, audit_events, task-mutations`)
  - `Claim:` one line
  - `Evidence date:` the recording date
  - `Status: live`
  - `Contributed-by: agent — <vendor/model>, <date>`
  - `Review: unreviewed`
- Body: hypothesis, evidence (paths + test names + result), verdict, scope/limits, and the implication
  for future task mutations, labelled as a recommendation.
- A new row in the `.salvor/domain-learnings/README.md` chronological index.

### 1.6 Show the review list

```bash
salvor agentic-capture-review
```

**Expected:** one entry listing the date, the slug `task-mutation-atomic-audit`, type Domain Learning,
status `unreviewed`, the source file path, and its provenance metadata. Point out that it is **not
ratified**. Ratification is a separate human gate ("Ratify this agent contribution?") that we are not
running today.

### 1.7 Commit and push the capture, on camera only

**Prompt (exact):**

> Commit only the new domain-learning artifact and the index change, with the trailer
> "Salvor-Contribution: agent", show me the staged diff, then push to origin main.

**Expected:** a commit such as `docs(salvor): capture DL:task-mutation-atomic-audit (unreviewed)` with the
trailer `Salvor-Contribution: agent`, then a push. Show the file on GitHub. **Close the Claude Code
session.**

---

## Part 2 — ChatGPT Web

Set up beforehand: the GitHub integration is connected with write access to `SalvorLabs/demo-app`, and the
Salvor custom MCP connector (read-only, tunneled) is enabled for the chat.

### 2.1 The prompt (paste exactly)

> You have two tools: the **Salvor MCP** (read-only; engineering memory for SalvorLabs/demo-app) and
> **GitHub** (you can create branches, commit, and open PRs in SalvorLabs/demo-app).
>
> 1. Use the Salvor MCP to search for knowledge about task mutations and audit events, then fetch the
>    Domain Learning **DL:task-mutation-atomic-audit**. Report its Status, Review, and Contributed-by
>    fields word for word. It is an **unreviewed agent contribution**: treat it as a hypothesis, not a
>    rule, and do not describe it as ratified or authoritative.
> 2. Check it yourself in GitHub before relying on it. Read `api/src/taskRepository.ts`,
>    `api/src/app.ts`, `api/src/db.ts`, and `api/test/taskRepository.test.ts` on `main`. Confirm or
>    refute, with file and line references, that task creation and its `audit_events` row are written in
>    one SQLite transaction and that the tests check rollback.
> 3. If it holds, create branch **`chatgpt/task-status-audit`** from `main` and implement **only**
>    `PATCH /api/tasks/:id/status`:
>    - body `{ "status": "todo" | "in_progress" | "completed" }`, validated with a new schema in
>      `shared/src/task.ts`;
>    - in ONE SQLite transaction, update the task's `status` and `updated_at` and insert an
>      `audit_events` row with `action = "task.status_changed"`, the actor, a timestamp, and metadata
>      containing `requestId`, `before: { status }`, and `after: { status }`;
>    - `200` with the updated task; `400` for invalid input; `404` for an unknown task (no audit row);
>      `500` with no partial write if the audit insert fails.
>    - Do not change existing endpoints, migrations, or the UI.
> 4. Add Vitest tests that follow the existing style (real in-memory SQLite, failures injected with
>    the `api/test/helpers.ts` triggers; no mocks): success plus the audit row; audit failure rolls back
>    the status change; unknown id writes nothing; invalid status writes nothing.
> 5. Open a PR from `chatgpt/task-status-audit` to `main`. In the PR description, cite
>    DL:task-mutation-atomic-audit **as provisional, unreviewed knowledge**. Say what you verified
>    independently in the source and tests, and what you did not verify (if you could not run the test
>    suite against this repo, say so plainly instead of claiming the tests pass).
>    Do not edit or ratify anything in `.salvor/`.

### 2.2 What to show

- The GPT transcript: the MCP search and fetch, with `Review: unreviewed` quoted. Then its own reading of
  the source on GitHub, with line references, before it writes any code.
- On GitHub: branch `chatgpt/task-status-audit`, the PR diff (`api/src/app.ts`,
  `api/src/taskRepository.ts`, `shared/src/task.ts`, new or changed tests), and the PR body citing the DL
  as provisional.
- **Verify locally, on camera.** ChatGPT cannot run tests on the Mac, so the operator does:

  ```bash
  git fetch origin && git checkout chatgpt/task-status-audit
  npm test                                   # new status tests should pass alongside the 32 baseline
  npm run dev
  curl -s -X PATCH http://127.0.0.1:3001/api/tasks/1/status \
    -H 'content-type: application/json' -d '{"status":"in_progress"}'
  curl -s 'http://127.0.0.1:3001/api/audit-events?taskId=1'
  ```

  **Expected rows for task 1:** the original `task.created` (actor `seed`), then
  `task.status_changed` (actor `demo-operator`, metadata `before.status = "completed"`,
  `after.status = "in_progress"`). Same check in SQL:
  `sqlite3 -header -column api/data/taskflow.db "SELECT id, action, task_id, actor, metadata FROM audit_events WHERE task_id = 1;"`

  If the tests fail, say so on camera. That is a real outcome, and the point is that the agent's output
  is checked against evidence.

- Return to `main` afterwards: `git checkout main`.

---

## Part 3 — Stretch: full circle (optional)

### 3.1 GPT captures its own unreviewed learning on its branch

**Follow-up prompt to ChatGPT (same chat):**

> On the same branch `chatgpt/task-status-audit`, add one evidence-backed Domain Learning as a new file
> in `.salvor/domain-learnings/`, following the format in `.salvor/domain-learnings/README.md`. Suggested
> subject: "Status changes record before/after status in audit metadata". Use the structured header
> (ID `DL:<kebab-slug>`, Subject, Claim, Evidence date, Status: live) plus
> `Contributed-by: agent — ChatGPT (<model>), <date>` and `Review: unreviewed`. Cite the code and the
> tests you just wrote as evidence, add a row to the README index, and cross-link
> DL:task-mutation-atomic-audit as the pattern your tests corroborate. If your GitHub tool lets you set a
> commit message, end it with the line `Salvor-Contribution: agent`. If it cannot, say so in the PR
> instead of claiming the trailer is there.

Note on camera: this knowledge is canonical **only on that branch** until it is merged and reconciled.
The GitHub client may not support arbitrary commit trailers. If it does not, the header provenance is
what counts, and the operator can record the trailer in the merge commit.

### 3.2 Merge, then Claude pulls

The operator merges the PR on GitHub **only after** the local `npm test` pass in 2.2. Then start a new
Claude Code session:

**Prompt:**

> Pull main. Incoming commits touched .salvor/. List every domain learning that has Review: unreviewed,
> read the one ChatGPT added, and check its claim against the merged code and tests. Run the tests.
> Do not ratify anything; report whether the evidence supports it.

**Expected:** Claude asks *"Incoming brain changes detected — run brain reconcile? (yes/no)"* (RULES
§10.2). It reads the GPT-authored artifact, runs `npm test`, and reports that the status-change test
corroborates both learnings. Both stay `Review: unreviewed`. `salvor agentic-capture-review` now lists
two entries.

---

## Recording reset checklist

Reset only what you mean to reset. Nothing here runs automatically, and every destructive step is
opt-in.

**Safe, local, repeatable**
- [ ] Demo database: stop `npm run dev`, then run `npm run demo:reset-db -- --yes`. This deletes only
      `api/data/taskflow.db*`; the next start re-seeds the four sample tasks.
- [ ] Return to `main`: `git checkout main && git pull --ff-only`.

**Capture state after a rehearsal.** Deliberate steps only; never erase knowledge by accident.
- [ ] If a rehearsal capture was pushed to `main`, undo it with **`git revert <capture-sha>`** and push.
      Do not use reset or force-push. The revert keeps the rehearsal artifact in history, and the next
      take starts with an empty `domain-learnings/` index. Before reverting, check that
      `git show --stat <capture-sha>` touches only the rehearsal artifact and its index row.
- [ ] Do not delete any other `Review: unreviewed` artifact. If one exists that you did not create in
      the rehearsal, stop and decide on purpose.
- [ ] Rehearsal PR: **close it without merging** on GitHub. If the rehearsal PR was merged, revert its
      merge commit, which removes the PATCH endpoint and any GPT learning. Delete the remote branch on
      purpose: `git push origin --delete chatgpt/task-status-audit`.
- [ ] Re-run the pre-flight checks.

**Never reset**
- The Salvor billing ledger or funded balances. A zero-credit starting state for the recording is the
  `salvor-mcp` session's job (e.g. a fresh demo account). Do not reset it from here.
- Git history on GitHub (no force-push).
