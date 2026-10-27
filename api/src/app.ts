import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { CreateTaskInputSchema, toValidationIssues, type ApiError } from '@taskflow/shared';
import type { TaskRepository } from './taskRepository.js';

export interface AppOptions {
  repo: TaskRepository;
  actor: string;
  logger?: boolean;
}

export function buildApp({ repo, actor, logger = false }: AppOptions): FastifyInstance {
  // UUID request ids are copied into audit metadata, so they must be unique across restarts.
  const app = Fastify({ logger, genReqId: () => randomUUID() });

  app.get('/api/health', async () => ({ ok: true }));

  app.get('/api/tasks', async () => repo.listTasks());

  app.post('/api/tasks', async (request, reply) => {
    const parsed = CreateTaskInputSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      const body: ApiError = {
        error: 'ValidationError',
        message: 'Invalid task',
        issues: toValidationIssues(parsed.error),
      };
      return reply.code(400).send(body);
    }
    const task = repo.createTask(parsed.data, { actor, requestId: request.id });
    return reply.code(201).send(task);
  });

  // Read-only view of the audit trail so the demo can show the row written with each mutation.
  app.get<{ Querystring: { taskId?: string } }>('/api/audit-events', async (request, reply) => {
    const { taskId } = request.query;
    if (taskId === undefined) return repo.listAuditEvents();
    const id = Number(taskId);
    if (!Number.isInteger(id) || id <= 0) {
      const body: ApiError = {
        error: 'ValidationError',
        message: 'taskId must be a positive integer',
      };
      return reply.code(400).send(body);
    }
    return repo.listAuditEvents({ taskId: id });
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    const status = error.statusCode && error.statusCode < 500 ? error.statusCode : 500;
    if (status === 500) request.log.error(error);
    const body: ApiError =
      status === 500
        ? { error: 'InternalError', message: 'Task could not be saved' }
        : { error: error.code ?? 'BadRequest', message: error.message };
    return reply.code(status).send(body);
  });

  return app;
}
