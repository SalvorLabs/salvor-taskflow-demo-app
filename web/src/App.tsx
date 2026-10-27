import { useEffect, useState, type FormEvent } from 'react';
import { TASK_STATUSES, type Task } from '@taskflow/shared';
import { ApiRequestError, createTask, fetchTasks } from './api.js';
import {
  EMPTY_DRAFT,
  STATUS_LABELS,
  countByStatus,
  formatCreatedAt,
  insertTask,
  sortTasks,
  validateDraft,
  type DraftResult,
  type TaskDraft,
} from './taskView.js';

type FieldErrors = Extract<DraftResult, { ok: false }>['errors'];

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [draft, setDraft] = useState<TaskDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTasks()
      .then((list) => setTasks(sortTasks(list)))
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = validateDraft(draft);
    if (!result.ok) return setErrors(result.errors);
    setErrors({});
    setSubmitError(undefined);
    setSaving(true);
    try {
      const created = await createTask(result.value);
      setTasks((current) => insertTask(current, created));
      setDraft(EMPTY_DRAFT);
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : 'Could not reach the API');
    } finally {
      setSaving(false);
    }
  };

  const counts = countByStatus(tasks);

  return (
    <main className="page">
      <header className="header">
        <h1>TaskFlow</h1>
        <p className="muted">Every task you create is written together with its audit event.</p>
      </header>

      <section className="card">
        <h2>New task</h2>
        <form onSubmit={onSubmit} noValidate>
          <label>
            Title
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="What needs doing?"
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title && <span className="error">{errors.title}</span>}
          </label>
          <label>
            Description
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={3}
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description && <span className="error">{errors.description}</span>}
          </label>
          <label>
            Initial status
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft({ ...draft, status: e.target.value as TaskDraft['status'] })
              }
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={saving}>
            {saving ? 'Adding…' : 'Add task'}
          </button>
          {submitError && <p className="error">{submitError}</p>}
        </form>
      </section>

      <section className="card">
        <div className="list-header">
          <h2>Tasks</h2>
          <ul className="counts">
            {TASK_STATUSES.map((s) => (
              <li key={s} className={`badge badge-${s}`}>
                {STATUS_LABELS[s]} · {counts[s]}
              </li>
            ))}
          </ul>
        </div>
        {loading && <p className="muted">Loading…</p>}
        {loadError && <p className="error">Could not load tasks: {loadError}</p>}
        {!loading && !loadError && tasks.length === 0 && <p className="muted">No tasks yet.</p>}
        <ul className="tasks">
          {tasks.map((task) => (
            <li key={task.id} className="task">
              <div className="task-main">
                <span className="task-title">{task.title}</span>
                {task.description && <span className="task-desc">{task.description}</span>}
              </div>
              <div className="task-meta">
                <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
                <span className="muted small">
                  #{task.id} · {formatCreatedAt(task.createdAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <p className="muted small">
          Status is set when a task is created; changing it later is not supported yet.
        </p>
      </section>
    </main>
  );
}
