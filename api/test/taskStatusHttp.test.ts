import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import type { Db } from '../src/db.js';
import { breakAuditInserts, count, setup } from './helpers.js';

describe('PATCH /api/tasks/:id/status', () => {
  let app: FastifyInstance;
  let db: Db;
  const start = () => {
    const s = setup(); db = s.db;
    app = buildApp({ repo: s.repo, actor: 'http-operator' });
    return s;
  };
  const patch = (id: string | number, payload: unknown) =>
    app.inject({ method: 'PATCH', url: `/api/tasks/${id}/status`, payload: payload as object });
  afterEach(async () => { await app?.close(); db?.close(); });

  it('returns 200 with updated task and accurate request-correlated audit metadata', async () => {
    const s = start();
    const task = s.repo.createTask({ title: 'Test', description: '', status: 'todo' }, { actor: 'seed' });
    const res = await patch(task.id, { status: 'in_progress' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ id: task.id, status: 'in_progress' });
    const audit = s.repo.listAuditEvents({ taskId: task.id })[1];
    expect(audit).toMatchObject({
      action: 'task.status_changed', actor: 'http-operator',
      metadata: { requestId: expect.any(String), before: { status: 'todo' }, after: { status: 'in_progress' } },
    });
  });

  it('supports sequential HTTP status transitions', async () => {
    const s = start();
    const task = s.repo.createTask({ title: 'Test', description: '', status: 'todo' }, { actor: 'seed' });
    expect((await patch(task.id, { status: 'in_progress' })).statusCode).toBe(200);
    expect((await patch(task.id, { status: 'completed' })).statusCode).toBe(200);
    expect(s.repo.listAuditEvents({ taskId: task.id }).slice(1).map(e => e.metadata.before)).toEqual([
      { status: 'todo' }, { status: 'in_progress' },
    ]);
  });

  it.each(['abc', '0', '-1', '1.5', '9007199254740992'])('rejects invalid id %s with 400', async id => {
    const s = start();
    const res = await patch(id, { status: 'completed' });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: 'ValidationError' });
    expect(count(db, 'audit_events')).toBe(0);
  });

  it.each([
    {}, { status: 'done' }, { status: 3 }, { status: null },
    { status: 'completed', priority: 'urgent' },
  ])('rejects invalid status body %j with 400 and no changes', async payload => {
    const s = start();
    const task = s.repo.createTask({ title: 'Test', description: '', status: 'todo' }, { actor: 'seed' });
    const res = await patch(task.id, payload);
    expect(res.statusCode).toBe(400);
    expect(s.repo.getTask(task.id)?.status).toBe('todo');
    expect(count(db, 'audit_events')).toBe(1);
  });

  it('returns 404 without creating an audit event when the task does not exist', async () => {
    start();
    const res = await patch(999, { status: 'completed' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ error: 'NotFound' });
    expect(count(db, 'audit_events')).toBe(0);
  });

  it('responds 500 and rolls back status, timestamp, and audit on audit-store failure', async () => {
    const s = start();
    const task = s.repo.createTask({ title: 'Test', description: '', status: 'todo' }, { actor: 'seed' });
    const before = s.repo.getTask(task.id);
    breakAuditInserts(db);
    const res = await patch(task.id, { status: 'completed' });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ error: 'InternalError', message: 'Task could not be saved' });
    expect(s.repo.getTask(task.id)).toEqual(before);
    expect(count(db, 'tasks')).toBe(1);
    expect(count(db, 'audit_events')).toBe(1);
  });
});
