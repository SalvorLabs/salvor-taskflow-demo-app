import { afterEach, describe, expect, it } from 'vitest';
import type { Db } from '../src/db.js';
import { FIXED_NOW, breakAuditInserts, count, setup } from './helpers.js';

const input = { title: 'Audit status', description: '', status: 'todo' as const };
const ctx = { actor: 'gpt-test', requestId: 'req-status-1' };

describe('status update audit atomicity (real SQLite)', () => {
  let db: Db;
  afterEach(() => db?.close());

  it('updates status and timestamp and records before/after with requestId', () => {
    const s = setup(); db = s.db;
    const created = s.repo.createTask(input, ctx);
    const updated = s.repo.updateTaskStatus(created.id, 'in_progress', ctx);
    expect(updated).toMatchObject({ id: created.id, status: 'in_progress', updatedAt: FIXED_NOW.toISOString() });
    expect(s.repo.listAuditEvents({ taskId: created.id })[1]).toMatchObject({
      action: 'task.status_changed', actor: 'gpt-test', createdAt: FIXED_NOW.toISOString(),
      metadata: { requestId: 'req-status-1', before: { status: 'todo' }, after: { status: 'in_progress' } },
    });
  });

  it('records each sequential transition against the immediately previous value', () => {
    const s = setup(); db = s.db;
    const task = s.repo.createTask(input, ctx);
    s.repo.updateTaskStatus(task.id, 'in_progress', ctx);
    s.repo.updateTaskStatus(task.id, 'completed', { actor: 'another', requestId: 'req-2' });
    expect(s.repo.getTask(task.id)?.status).toBe('completed');
    expect(s.repo.listAuditEvents({ taskId: task.id }).filter(e => e.action === 'task.status_changed').map(e => e.metadata)).toEqual([
      { requestId: 'req-status-1', before: { status: 'todo' }, after: { status: 'in_progress' } },
      { requestId: 'req-2', before: { status: 'in_progress' }, after: { status: 'completed' } },
    ]);
  });

  it('returns undefined for a missing task and leaves the audit trail intact', () => {
    const s = setup(); db = s.db;
    expect(s.repo.updateTaskStatus(999, 'completed', ctx)).toBeUndefined();
    expect(count(db, 'audit_events')).toBe(0);
  });

  it('rolls back task status and timestamp if the audit insertion aborts', () => {
    const s = setup(); db = s.db;
    const task = s.repo.createTask(input, ctx);
    const before = s.repo.getTask(task.id);
    breakAuditInserts(db);
    expect(() => s.repo.updateTaskStatus(task.id, 'completed', ctx)).toThrow('audit store unavailable');
    expect(s.repo.getTask(task.id)).toEqual(before);
    expect(count(db, 'tasks')).toBe(1);
    expect(count(db, 'audit_events')).toBe(1);
  });
});
