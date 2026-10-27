import type { ApiError, Task, ValidCreateTaskInput } from '@taskflow/shared';

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiError | undefined,
  ) {
    super(body?.message ?? `Request failed with status ${status}`);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => undefined)) as ApiError | undefined;
    throw new ApiRequestError(res.status, body);
  }
  return (await res.json()) as T;
}

export const fetchTasks = () => request<Task[]>('/api/tasks');

export const createTask = (input: ValidCreateTaskInput) =>
  request<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(input) });
