import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { createTaskRepository } from '../src/taskRepository.js';
import { openDatabase, type Db } from '../src/db.js';
import { breakAuditInserts, count, FIXED_NOW, setup } from './helpers.js';
import type { FastifyInstance } from 'fastify';

const createInput = { title: 'Finish AMA prep', description: 'Follow the evidence', status: 'todo' as const };
const ctx = { actor: 'demo-operator', requestId: 'req-status-1' };

describe('task status change and atomic audit logging', () => {
  let db: Db;
  let app: FastifyInstance | undefined;
  afterEach(async () => {
    await app?.close();
    db?.close();
    app = undefined;
  });

  it('changes status and updated_at, keeping before/after metadata and request identity', () => {
    let now = FIXED_NOW;
    db = openDatabase(':memory:');
    const repo = createTaskRepository(db, () => now);
    const task = repo.createTask(createInput, ctx);
    now = new Date('2026-10-27T12:05:00.000Z');
    const changed = repo.updateTaskStatus(task.id, 'in_progress', ctx);
    expect(changed).toMatchObject({
      id: task.id,
      status: 'in_progress',
      createdAt: task.createdAt,
      updatedAt: now.toISOString(),
    });
    const history = repo.listAuditEvents({ taskId: task.id });
    expect(history).toHaveLength(2);
    expect(history[1]).toMatchObject({
      action: 'task.status_changed',
      actor: ctx.actor,
      createdAt: now.toISOString(),
      metadata: {
        requestId: ctx.requestId,
        before: { status: 'todo' },
        after: { status: 'in_progress' },
      },
    });
  });

  it('rolls back the status and timestamp when the audit insert fails', () => {
    const s = setup();
    db = s.db;
    const task = s.repo.createTask(createInput, ctx);
    breakAuditInserts(db);
    expect(() => s.repo.updateTaskStatus(task.id, 'completed', ctx)).toThrow('audit store unavailable');
    expect(s.repo.getTask(task.id)).toEqual(task);
    expect(s.repo.listAuditEvents({ taskId: task.id })).toHaveLength(1);
    expect(count(db, 'tasks')).toBe(1);
    expect(count(db, 'audit_events')).toBe(1);
  });

  it('returns undefined for unknown tasks and never writes an audit row', () => {
    const s = setup();
    db = s.db;
    expect(s.repo.updateTaskStatus(123, 'completed', ctx)).toBeUndefined();
    expect(count(db, 'tasks')).toBe(0);
    expect(count(db, 'audit_events')).toBe(0);
  });

  it('records chronological before/after transitions across multiple status changes', () => {
    const s = setup();
    db = s.db;
    const task = s.repo.createTask(createInput, ctx);
    s.repo.updateTaskStatus(task.id, 'in_progress', ctx);
    s.repo.updateTaskStatus(task.id, 'completed', ctx);
    const changes = s.repo.listAuditEvents({ taskId: task.id }).slice(1);
    expect(changes.map((e) => e.metadata)).toEqual([
      { requestId: ctx.requestId, before: { status: 'todo' }, after: { status: 'in_progress' } },
      { requestId: ctx.requestId, before: { status: 'in_progress' }, after: { status: 'completed' } },
    ]);
  });

  it('exposes PATCH over HTTP, including the audit row and the actor', async () => {
    const s = setup();
    db = s.db;
    const task = s.repo.createTask(createInput, ctx);
    app = buildApp({ repo: s.repo, actor: 'web-demo' });
    const response = await app.inject({
      method: 'PATCH', url: '/api/tasks/' + task.id + '/status', payload: { status: 'completed' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: task.id, status: 'completed' });
    const history = s.repo.listAuditEvents({ taskId: task.id });
    expect(history).toHaveLength(2);
    expect(history[1]).toMatchObject({
      action: 'task.status_changed',
      actor: 'web-demo',
      metadata: {
        requestId: expect.any(String),
        before: { status: 'todo' },
        after: { status: 'completed' },
      },
    });
  });

  it.each([
    ['invalid status', { status: 'done' }],
    ['missing status', {}],
    ['unexpected field', { status: 'completed', extra: true }],
    ['non-string status', { status: 123 }],
  ])('rejects %s with 400 and makes no changes', async (_label, payload) => {
    const s = setup();
    db = s.db;
    const task = s.repo.createTask(createInput, ctx);
    app = buildApp({ repo: s.repo, actor: ctx.actor });
    const response = await app.inject({
      method: 'PATCH', url: '/api/tasks/' + task.id + '/status', payload,
    });
    expect(response.statusCode).toBe(400);
    expect(s.repo.getTask(task.id)).toEqual(task);
    expect(s.repo.listAuditEvents({ taskId: task.id })).toHaveLength(1);
  });

  it('returns 404 for a missing task and does not create an audit event', async () => {
    const s = setup();
    db = s.db;
    app = buildApp({ repo: s.repo, actor: ctx.actor });
    const response = await app.inject({
      method: 'PATCH', url: '/api/tasks/999/status', payload: { status: 'completed' },
    });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: 'NotFound' });
    expect(count(db, 'audit_events')).toBe(0);
  });

  it.each(['/api/tasks/abc/status', '/api/tasks/0/status', '/api/tasks/-1/status'])(
    'rejects invalid task id %s with 400', async (url) => {
      const s = setup();
      db = s.db;
      app = buildApp({ repo: s.repo, actor: ctx.actor });
      const response = await app.inject({
        method: 'PATCH', url, payload: { status: 'completed' },
      });
      expect(response.statusCode).toBe(400);
      expect(count(db, 'audit_events')).toBe(0);
    },
  );

  it('returns 500 and leaves the task unchanged if the audit insert fails', async () => {
    const s = setup();
    db = s.db;
    const task = s.repo.createTask(createInput, ctx);
    breakAuditInserts(db);
    app = buildApp({ repo: s.repo, actor: ctx.actor });
    const response = await app.inject({
      method: 'PATCH', url: '/api/tasks/' + task.id + '/status', payload: { status: 'completed' },
    });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ error: 'InternalError', message: 'Task could not be saved' });
    expect(s.repo.getTask(task.id)).toEqual(task);
    expect(count(db, 'audit_events')).toBe(1);
  });
});
