import { describe, it, expect, vi } from 'vitest';
import { deckCreateSchema } from 'shared-types';
import { validateBody } from '../src/middleware/validate.js';

const schema = deckCreateSchema;

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('validateBody middleware', () => {
  it('responds with 400 and a ValidationError shape for an invalid body, without calling next', () => {
    const req = { body: { title: '' } };
    const res = mockRes();
    const next = vi.fn();

    validateBody(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'ValidationError', message: 'Invalid request body' }),
    );
    expect(next).not.toHaveBeenCalled();
    expect(req.validatedBody).toBeUndefined();
  });

  it('never reaches a downstream DB-calling service when validation fails', () => {
    const dbService = vi.fn();
    const req = { body: {} };
    const res = mockRes();
    const next = vi.fn(() => dbService());

    validateBody(schema)(req, res, next);

    expect(dbService).not.toHaveBeenCalled();
  });

  it('sets req.validatedBody and calls next() for a valid body', () => {
    const req = { body: { title: 'A valid title' } };
    const res = mockRes();
    const next = vi.fn();

    validateBody(schema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.validatedBody).toEqual({ title: 'A valid title' });
  });
});
