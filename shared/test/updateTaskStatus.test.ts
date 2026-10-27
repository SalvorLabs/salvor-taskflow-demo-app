import { describe, expect, it } from 'vitest';
import { UpdateTaskStatusInputSchema, toValidationIssues } from '../src/index.js';

describe('UpdateTaskStatusInputSchema', () => {
  it.each(['todo', 'in_progress', 'completed'])('accepts the status %s', status => {
    expect(UpdateTaskStatusInputSchema.parse({ status })).toEqual({ status });
  });

  it.each([
    {},
    { status: 'done' },
    { status: null },
    { status: 5 },
    { status: 'todo', extra: true },
  ])('rejects invalid or extra fields: %j', payload => {
    const parsed = UpdateTaskStatusInputSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(toValidationIssues(parsed.error).length).toBeGreaterThan(0);
  });
});
