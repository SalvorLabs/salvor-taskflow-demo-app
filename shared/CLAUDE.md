# shared — TaskFlow schemas

Small TypeScript-source package (`@taskflow/shared`) with zod schemas + inferred types shared by api and web. No
runtime dependencies beyond zod; consumed as TS source (no build step).

## Key Files
- `src/task.ts` — `TaskStatus`, `Task`, `CreateTaskInput` schemas/types
- `src/index.ts` — barrel export
- `test/` — Vitest schema tests

## Architecture Notes
- Single owner of the task wire shape; api and web import from here rather than redefining types.

## Build
- Type-checked by `npm run build -w shared` (`tsc --noEmit`).

For codebase tree: use Serena MCP `get_symbols_overview`.
For domain logic: see `.salvor/DOMAIN_REF.md`. For infra/ops: see `.salvor/INFRA.md`.
