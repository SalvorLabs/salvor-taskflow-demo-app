import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import type { Db } from '../src/db.js';
import { seedIfEmpty, SEED_TASKS } from '../src/seed.js';
import { breakAuditInserts, count, setup } from './helpers.js';

describe('HTTP API', () => {
  let app: FastifyInstance;
  let db: Db;

  const start = (opts: { seed?: boolean } = {}) => {
    const s = setup();
    db = s.db;
    if (opts.seed) seedIfEmpty(s.repo);
    app = buildApp({ repo: s.repo, actor: 'demo-operator' });
    return s;
  };

  afterEach(async () => {
    await app?.close();
    db?.close();
  });

  describe('GET /api/tasks', () => {
    it('returns the seeded tasks', async () => {
      start({ seed: true });
      const res = await app.inject({ method: 'GET', url: '/api/tasks' });
      expect(res.statusCode).toBe(200);
      const tasks = res.json();
      expect(tasks).toHaveLength(SEED_TASKS.length);
      expect(tasks.map((t: { title: string }) => t.title).sort()).toEqual(
        SEED_TASKS.map((t) => t.title).sort(),
      );
    });

    it('returns an empty list for an empty database', async () => {
      start();
      const res = await app.inject({ method: 'GET', url: '/api/tasks' });
      expect(res.json()).toEqual([]);
    });
  });

  describe('POST /api/tasks', () => {
    it('creates a task, returns 201 with it, and records a task.created audit event', async () => {
      start();
      const res = await app.inject({
        method: 'POST',
        url: '/api/tasks',
        payload: { title: 'Ship demo', description: 'Record today', status: 'in_progress' },
      });
      expect(res.statusCode).toBe(201);
      const task = res.json();
      expect(task).toMatchObject({
        id: 1,
        title: 'Ship demo',
        description: 'Record today',
        status: 'in_progress',
      });

      const audit = await app.inject({ method: 'GET', url: `/api/audit-events?taskId=${task.id}` });
      expect(audit.json()).toEqual([
        expect.objectContaining({
          action: 'task.created',
          taskId: task.id,
          actor: 'demo-operator',
          metadata: expect.objectContaining({ requestId: expect.any(String) }),
        }),
      ]);
    });

    it('defaults description and status', async () => {
      start();
      const res = await app.inject({
        method: 'POST',
        url: '/api/tasks',
        payload: { title: 'Bare' },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json()).toMatchObject({ description: '', status: 'todo' });
    });

    it.each([
      ['missing title', {}],
      ['blank title', { title: '   ' }],
      ['unknown status', { title: 'x', status: 'done' }],
      ['unknown field', { title: 'x', priority: 'high' }],
    ])('rejects %s with 400 and writes nothing', async (_label, payload) => {
      start();
      const res = await app.inject({ method: 'POST', url: '/api/tasks', payload });
      expect(res.statusCode).toBe(400);
      expect(res.json()).toMatchObject({ error: 'ValidationError' });
      expect(count(db, 'tasks')).toBe(0);
      expect(count(db, 'audit_events')).toBe(0);
    });

    it('rejects a non-JSON body with 400', async () => {
      start();
      const res = await app.inject({
        method: 'POST',
        url: '/api/tasks',
        headers: { 'content-type': 'application/json' },
        payload: '{not json',
      });
      expect(res.statusCode).toBe(400);
      expect(count(db, 'tasks')).toBe(0);
    });

    it('returns 500 and persists neither row when the audit insert fails', async () => {
      start();
      breakAuditInserts(db);
      const res = await app.inject({
        method: 'POST',
        url: '/api/tasks',
        payload: { title: 'Doomed' },
      });
      expect(res.statusCode).toBe(500);
      expect(res.json()).toEqual({ error: 'InternalError', message: 'Task could not be saved' });
      expect(count(db, 'tasks')).toBe(0);
      expect(count(db, 'audit_events')).toBe(0);
    });
  });

  describe('GET /api/audit-events', () => {
    it('lists seed audit events and validates taskId', async () => {
      start({ seed: true });
      const all = await app.inject({ method: 'GET', url: '/api/audit-events' });
      expect(all.json()).toHaveLength(SEED_TASKS.length);
      expect(all.json().every((e: { actor: string }) => e.actor === 'seed')).toBe(true);
      const bad = await app.inject({ method: 'GET', url: '/api/audit-events?taskId=abc' });
      expect(bad.statusCode).toBe(400);
    });
  });
});
