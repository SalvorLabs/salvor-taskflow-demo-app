import type { AuditEvent, Task, ValidCreateTaskInput } from '@taskflow/shared';
import type { Db } from './db.js';

export interface MutationContext {
  /** Who performed the mutation. Demo stand-in for an authenticated principal. */
  actor: string;
  /** Correlates the audit row with the HTTP request that caused it. */
  requestId?: string;
}

export interface TaskRepository {
  listTasks(): Task[];
  getTask(id: number): Task | undefined;
  createTask(input: ValidCreateTaskInput, ctx: MutationContext): Task;
  listAuditEvents(filter?: { taskId?: number }): AuditEvent[];
  countTasks(): number;
}

interface TaskRow {
  id: number;
  title: string;
  description: string;
  status: Task['status'];
  created_at: string;
  updated_at: string;
}

interface AuditRow {
  id: number;
  action: string;
  task_id: number;
  actor: string;
  created_at: string;
  metadata: string;
}

const toTask = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title,
  description: row.description,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toAuditEvent = (row: AuditRow): AuditEvent => ({
  id: row.id,
  action: row.action,
  taskId: row.task_id,
  actor: row.actor,
  createdAt: row.created_at,
  metadata: JSON.parse(row.metadata) as Record<string, unknown>,
});

export function createTaskRepository(db: Db, clock: () => Date = () => new Date()): TaskRepository {
  const selectAll = db.prepare<[], TaskRow>(
    'SELECT * FROM tasks ORDER BY created_at DESC, id DESC',
  );
  const selectById = db.prepare<[number], TaskRow>('SELECT * FROM tasks WHERE id = ?');
  const countAll = db.prepare<[], { n: number }>('SELECT COUNT(*) AS n FROM tasks');
  const insertTask = db.prepare(
    `INSERT INTO tasks (title, description, status, created_at, updated_at)
     VALUES (@title, @description, @status, @now, @now)`,
  );
  const insertAudit = db.prepare(
    `INSERT INTO audit_events (action, task_id, actor, created_at, metadata)
     VALUES (@action, @taskId, @actor, @createdAt, @metadata)`,
  );
  const selectAudit = db.prepare<[], AuditRow>('SELECT * FROM audit_events ORDER BY id');
  const selectAuditByTask = db.prepare<[number], AuditRow>(
    'SELECT * FROM audit_events WHERE task_id = ? ORDER BY id',
  );

  // The task row and its audit row are written in ONE SQLite transaction: if either insert
  // throws, better-sqlite3 rolls the whole transaction back, so a task never exists without
  // its audit event and a failed create never leaves a ghost audit event.
  const createTaskTx = db.transaction((input: ValidCreateTaskInput, ctx: MutationContext) => {
    const now = clock().toISOString();
    const { lastInsertRowid } = insertTask.run({ ...input, now });
    const taskId = Number(lastInsertRowid);
    insertAudit.run({
      action: 'task.created',
      taskId,
      actor: ctx.actor,
      createdAt: now,
      metadata: JSON.stringify({
        requestId: ctx.requestId ?? null,
        after: { title: input.title, description: input.description, status: input.status },
      }),
    });
    return toTask(selectById.get(taskId)!);
  });

  return {
    listTasks: () => selectAll.all().map(toTask),
    getTask: (id) => {
      const row = selectById.get(id);
      return row ? toTask(row) : undefined;
    },
    createTask: (input, ctx) => createTaskTx(input, ctx),
    listAuditEvents: (filter) =>
      (filter?.taskId === undefined ? selectAudit.all() : selectAuditByTask.all(filter.taskId)).map(
        toAuditEvent,
      ),
    countTasks: () => countAll.get()!.n,
  };
}
