import type { ValidCreateTaskInput } from '@taskflow/shared';
import type { TaskRepository } from './taskRepository.js';

export const SEED_ACTOR = 'seed';

export const SEED_TASKS: ValidCreateTaskInput[] = [
  {
    title: 'Draft Q4 release notes',
    description: 'Summarize the API and UI changes shipped since the last release.',
    status: 'completed',
  },
  {
    title: 'Review audit-log retention policy',
    description: 'Confirm how long audit_events rows must be kept for compliance.',
    status: 'in_progress',
  },
  {
    title: 'Add status updates to tasks',
    description: 'Planned: PATCH /api/tasks/:id/status (not implemented yet).',
    status: 'todo',
  },
  {
    title: 'Prepare AMA demo walkthrough',
    description: 'Rehearse the Claude Code → ChatGPT handoff end to end.',
    status: 'todo',
  },
];

/** Seeds an empty database through the normal repository path, so seed rows are audited too. */
export function seedIfEmpty(repo: TaskRepository): number {
  if (repo.countTasks() > 0) return 0;
  for (const task of SEED_TASKS) repo.createTask(task, { actor: SEED_ACTOR, requestId: 'seed' });
  return SEED_TASKS.length;
}
