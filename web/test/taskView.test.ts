import { describe, expect, it } from 'vitest';
import type { Task } from '@taskflow/shared';
import {
  EMPTY_DRAFT,
  countByStatus,
  formatCreatedAt,
  insertTask,
  sortTasks,
  validateDraft,
} from '../src/taskView.js';

const task = (id: number, createdAt: string, status: Task['status'] = 'todo'): Task => ({
  id,
  title: `Task ${id}`,
  description: '',
  status,
  createdAt,
  updatedAt: createdAt,
});

describe('validateDraft', () => {
  it('returns the normalized input for a valid draft', () => {
    expect(validateDraft({ ...EMPTY_DRAFT, title: '  Plan sprint ' })).toEqual({
      ok: true,
      value: { title: 'Plan sprint', description: '', status: 'todo' },
    });
  });

  it('returns a field error for a blank title', () => {
    expect(validateDraft(EMPTY_DRAFT)).toEqual({
      ok: false,
      errors: { title: 'Title is required' },
    });
  });

  it('returns a field error for an over-long description', () => {
    const result = validateDraft({ ...EMPTY_DRAFT, title: 'ok', description: 'x'.repeat(2001) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.description).toMatch(/at most 2000/);
  });
});

describe('task list logic', () => {
  const tasks = [
    task(1, '2026-10-01T00:00:00.000Z', 'completed'),
    task(2, '2026-10-02T00:00:00.000Z', 'in_progress'),
    task(3, '2026-10-02T00:00:00.000Z'),
  ];

  it('sorts newest first with a stable id tie-break', () => {
    expect(sortTasks(tasks).map((t) => t.id)).toEqual([3, 2, 1]);
  });

  it('counts tasks per status, including zero buckets', () => {
    expect(countByStatus(tasks)).toEqual({ todo: 1, in_progress: 1, completed: 1 });
    expect(countByStatus([])).toEqual({ todo: 0, in_progress: 0, completed: 0 });
  });

  it('inserts a created task at the top without duplicating it', () => {
    const created = task(4, '2026-10-03T00:00:00.000Z');
    expect(insertTask(tasks, created).map((t) => t.id)).toEqual([4, 3, 2, 1]);
    expect(insertTask([created, ...tasks], created)).toHaveLength(4);
  });

  it('formats timestamps in UTC and passes through invalid input', () => {
    expect(formatCreatedAt('2026-10-27T12:00:00.000Z')).toBe('Oct 27, 2026, 12:00 PM');
    expect(formatCreatedAt('not-a-date')).toBe('not-a-date');
  });
});
