import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export type Db = Database.Database;

/**
 * Versioned, append-only migrations. Never edit an applied migration — add a new one.
 */
export const MIGRATIONS: ReadonlyArray<{ id: string; sql: string }> = [
  {
    id: '001_create_tasks_and_audit_events',
    sql: `
      CREATE TABLE tasks (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        title       TEXT    NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
        description TEXT    NOT NULL DEFAULT '',
        status      TEXT    NOT NULL CHECK (status IN ('todo', 'in_progress', 'completed')),
        created_at  TEXT    NOT NULL,
        updated_at  TEXT    NOT NULL
      );

      CREATE TABLE audit_events (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        action     TEXT    NOT NULL,
        task_id    INTEGER NOT NULL REFERENCES tasks (id),
        actor      TEXT    NOT NULL CHECK (length(actor) > 0),
        created_at TEXT    NOT NULL,
        metadata   TEXT    NOT NULL CHECK (json_valid(metadata))
      );

      CREATE INDEX idx_audit_events_task_id ON audit_events (task_id);
    `,
  },
];

export function openDatabase(path: string): Db {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma('foreign_keys = ON');
  if (path !== ':memory:') db.pragma('journal_mode = WAL');
  migrate(db);
  return db;
}

export function migrate(db: Db): string[] {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id         TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);
  const applied = new Set(db.prepare('SELECT id FROM schema_migrations').pluck().all() as string[]);
  const ran: string[] = [];
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    db.transaction(() => {
      db.exec(migration.sql);
      db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)').run(
        migration.id,
        new Date().toISOString(),
      );
    })();
    ran.push(migration.id);
  }
  return ran;
}
