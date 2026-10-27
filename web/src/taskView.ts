import {
  CreateTaskInputSchema,
  TASK_STATUSES,
  toValidationIssues,
  type Task,
  type TaskStatus,
  type ValidCreateTaskInput,
} from '@taskflow/shared';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  completed: 'Completed',
};

export interface TaskDraft {
  title: string;
  description: string;
  status: TaskStatus;
}

export const EMPTY_DRAFT: TaskDraft = { title: '', description: '', status: 'todo' };

export type DraftResult =
  | { ok: true; value: ValidCreateTaskInput }
  | { ok: false; errors: Partial<Record<keyof TaskDraft, string>> };

/** Validates the form with the same schema the API enforces. */
export function validateDraft(draft: TaskDraft): DraftResult {
  const parsed = CreateTaskInputSchema.safeParse(draft);
  if (parsed.success) return { ok: true, value: parsed.data };
  const errors: Partial<Record<keyof TaskDraft, string>> = {};
  for (const issue of toValidationIssues(parsed.error)) {
    const key = issue.path as keyof TaskDraft;
    if (key in EMPTY_DRAFT && !errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

export function countByStatus(tasks: readonly Task[]): Record<TaskStatus, number> {
  const counts = Object.fromEntries(TASK_STATUSES.map((s) => [s, 0])) as Record<TaskStatus, number>;
  for (const task of tasks) counts[task.status]++;
  return counts;
}

/** Newest first; ties broken by id so ordering is stable. */
export function sortTasks(tasks: readonly Task[]): Task[] {
  return [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
}

/** Puts a freshly created task at the top without refetching. */
export function insertTask(tasks: readonly Task[], created: Task): Task[] {
  return sortTasks([created, ...tasks.filter((t) => t.id !== created.id)]);
}

export function formatCreatedAt(iso: string, locale = 'en-US'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
}
