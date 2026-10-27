import { describe, expect, it } from 'vitest';
import { CreateTaskInputSchema, toValidationIssues } from '../src/index.js';

describe('CreateTaskInputSchema', () => {
  it('trims fields and applies defaults', () => {
    const parsed = CreateTaskInputSchema.parse({ title: '  Write README  ' });
    expect(parsed).toEqual({ title: 'Write README', description: '', status: 'todo' });
  });

  it('accepts every known status', () => {
    for (const status of ['todo', 'in_progress', 'completed'] as const) {
      expect(CreateTaskInputSchema.parse({ title: 't', status }).status).toBe(status);
    }
  });

  it('rejects blank titles, unknown statuses and unknown fields', () => {
    const result = CreateTaskInputSchema.safeParse({ title: '   ', status: 'done', id: 7 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = toValidationIssues(result.error).map((i) => i.path);
      expect(paths).toEqual(expect.arrayContaining(['title', 'status', '(body)']));
    }
  });

  it('rejects over-long titles', () => {
    expect(CreateTaskInputSchema.safeParse({ title: 'x'.repeat(201) }).success).toBe(false);
  });
});
