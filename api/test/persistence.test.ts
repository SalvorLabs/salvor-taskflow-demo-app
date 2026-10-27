import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { migrate, MIGRATIONS, openDatabase } from '../src/db.js';
import { seedIfEmpty, SEED_TASKS } from '../src/seed.js';
import { createTaskRepository } from '../src/taskRepository.js';

describe('SQLite persistence', () => {
  let dir: string | undefined;
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = undefined;
  });

  it('keeps tasks and audit events across reopen of a file-backed database', () => {
    dir = mkdtempSync(join(tmpdir(), 'taskflow-'));
    const path = join(dir, 'nested', 'taskflow.db');

    const first = openDatabase(path);
    const created = createTaskRepository(first).createTask(
      { title: 'Survives restart', description: '', status: 'todo' },
      { actor: 'demo-operator' },
    );
    first.close();

    const second = openDatabase(path);
    const repo = createTaskRepository(second);
    expect(repo.getTask(created.id)).toEqual(created);
    expect(repo.listAuditEvents({ taskId: created.id })).toHaveLength(1);
    second.close();
  });

  it('applies migrations once and is idempotent', () => {
    const db = openDatabase(':memory:');
    expect(migrate(db)).toEqual([]);
    const ids = db.prepare('SELECT id FROM schema_migrations ORDER BY id').pluck().all();
    expect(ids).toEqual(MIGRATIONS.map((m) => m.id));
    db.close();
  });

  it('seeds an empty database (with audit events) exactly once', () => {
    const db = openDatabase(':memory:');
    const repo = createTaskRepository(db);
    expect(seedIfEmpty(repo)).toBe(SEED_TASKS.length);
    expect(seedIfEmpty(repo)).toBe(0);
    expect(repo.countTasks()).toBe(SEED_TASKS.length);
    expect(repo.listAuditEvents()).toHaveLength(SEED_TASKS.length);
    db.close();
  });
});
