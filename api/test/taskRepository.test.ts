import { afterEach, describe, expect, it } from 'vitest';
import type { Db } from '../src/db.js';
import { FIXED_NOW, breakAuditInserts, breakTaskInserts, count, setup } from './helpers.js';

const input = { title: 'Write tests', description: 'Cover rollback', status: 'todo' as const };
const ctx = { actor: 'demo-operator', requestId: 'req-1' };

describe('taskRepository', () => {
  let db: Db;
  afterEach(() => db?.close());

  describe('createTask', () => {
    it('persists the task and returns it', () => {
      const s = setup();
      db = s.db;
      const task = s.repo.createTask(input, ctx);
      expect(task).toEqual({
        id: 1,
        title: 'Write tests',
        description: 'Cover rollback',
        status: 'todo',
        createdAt: FIXED_NOW.toISOString(),
        updatedAt: FIXED_NOW.toISOString(),
      });
      expect(s.repo.getTask(task.id)).toEqual(task);
    });

    it('writes exactly one task.created audit event with actor, timestamp and metadata', () => {
      const s = setup();
      db = s.db;
      const task = s.repo.createTask(input, ctx);
      expect(s.repo.listAuditEvents({ taskId: task.id })).toEqual([
        {
          id: 1,
          action: 'task.created',
          taskId: task.id,
          actor: 'demo-operator',
          createdAt: FIXED_NOW.toISOString(),
          metadata: {
            requestId: 'req-1',
            after: { title: 'Write tests', description: 'Cover rollback', status: 'todo' },
          },
        },
      ]);
    });
  });

  // Evidence for the task-mutation / audit-trail atomicity pattern: either both rows persist or neither does.
  describe('task creation audit atomicity', () => {
    it('rolls back the task when the audit insert fails', () => {
      const s = setup();
      db = s.db;
      s.repo.createTask(input, ctx);
      breakAuditInserts(db);

      expect(() => s.repo.createTask({ ...input, title: 'Doomed' }, ctx)).toThrow(
        'audit store unavailable',
      );

      expect(count(db, 'tasks')).toBe(1);
      expect(count(db, 'audit_events')).toBe(1);
      expect(s.repo.listTasks().map((t) => t.title)).toEqual(['Write tests']);
    });

    it('never leaves a ghost audit event when the task insert fails', () => {
      const s = setup();
      db = s.db;
      breakTaskInserts(db);

      expect(() => s.repo.createTask(input, ctx)).toThrow('task store unavailable');

      expect(count(db, 'tasks')).toBe(0);
      expect(count(db, 'audit_events')).toBe(0);
    });

    it('rolls back when the audit row violates a constraint (empty actor)', () => {
      const s = setup();
      db = s.db;
      expect(() => s.repo.createTask(input, { actor: '' })).toThrow(/CHECK constraint failed/);
      expect(count(db, 'tasks')).toBe(0);
      expect(count(db, 'audit_events')).toBe(0);
    });

    it('keeps one audit event per task across many creates', () => {
      const s = setup();
      db = s.db;
      for (let i = 0; i < 5; i++) s.repo.createTask({ ...input, title: `Task ${i}` }, ctx);
      const rows = db
        .prepare(
          `SELECT t.id, COUNT(a.id) AS events FROM tasks t
           LEFT JOIN audit_events a ON a.task_id = t.id AND a.action = 'task.created'
           GROUP BY t.id`,
        )
        .all() as Array<{ id: number; events: number }>;
      expect(rows).toHaveLength(5);
      expect(rows.every((r) => r.events === 1)).toBe(true);
    });
  });

  describe('listTasks', () => {
    it('returns newest first', () => {
      const s = setup();
      db = s.db;
      s.repo.createTask({ ...input, title: 'first' }, ctx);
      s.repo.createTask({ ...input, title: 'second' }, ctx);
      expect(s.repo.listTasks().map((t) => t.title)).toEqual(['second', 'first']);
    });
  });
});
