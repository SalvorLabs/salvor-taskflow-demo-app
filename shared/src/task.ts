import { z } from 'zod';

export const TASK_STATUSES = ['todo', 'in_progress', 'completed'] as const;

export const TaskStatusSchema = z.enum(TASK_STATUSES);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 2000;

/** Body accepted by POST /api/tasks. */
export const CreateTaskInputSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(1, 'Title is required')
      .max(TITLE_MAX, `Title must be at most ${TITLE_MAX} characters`),
    description: z
      .string()
      .trim()
      .max(DESCRIPTION_MAX, `Description must be at most ${DESCRIPTION_MAX} characters`)
      .default(''),
    status: TaskStatusSchema.default('todo'),
  })
  .strict();
export type CreateTaskInput = z.input<typeof CreateTaskInputSchema>;
export type ValidCreateTaskInput = z.output<typeof CreateTaskInputSchema>;

/** Only a status value may be patched; unknown fields are rejected. */
export const UpdateTaskStatusInputSchema = z.object({ status: TaskStatusSchema }).strict();
export type ValidUpdateTaskStatusInput = z.output<typeof UpdateTaskStatusInputSchema>;

export const TaskSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  status: TaskStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Task = z.infer<typeof TaskSchema>;

export const AuditEventSchema = z.object({
  id: z.number().int().positive(),
  action: z.string(),
  taskId: z.number().int().positive(),
  actor: z.string(),
  createdAt: z.string(),
  metadata: z.record(z.unknown()),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ApiError {
  error: string;
  message: string;
  issues?: ValidationIssue[];
}

export function toValidationIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.') || '(body)',
    message: issue.message,
  }));
}
