import { openDatabase, type Db } from '../src/db.js';
import { createTaskRepository } from '../src/taskRepository.js';

export const FIXED_NOW = new Date('2026-10-27T12:00:00.000Z');

export function setup() {
  const db = openDatabase(':memory:');
  const repo = createTaskRepository(db, () => FIXED_NOW);
  return { db, repo };
}

export const count = (db: Db, table: 'tasks' | 'audit_events'): number =>
  db.prepare(`SELECT COUNT(*) FROM ${table}`).pluck().get() as number;

/** Makes the real audit_events INSERT fail inside SQLite (no mocks), as a broken audit store would. */
export function breakAuditInserts(db: Db): void {
  db.exec(`CREATE TRIGGER fail_audit_insert BEFORE INSERT ON audit_events
           BEGIN SELECT RAISE(ABORT, 'audit store unavailable'); END;`);
}

/** Makes the real tasks INSERT fail inside SQLite. */
export function breakTaskInserts(db: Db): void {
  db.exec(`CREATE TRIGGER fail_task_insert BEFORE INSERT ON tasks
           BEGIN SELECT RAISE(ABORT, 'task store unavailable'); END;`);
}
