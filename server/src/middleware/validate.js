import { formatZodError } from '../utils/validation.js';

/**
 * Express middleware factory that validates `req.body` against a Zod schema
 * before any route handler (and therefore any DB call) runs.
 *
 * On failure, responds with a 400 ValidationError JSON payload and does not
 * call `next()`. On success, attaches the parsed/coerced data to
 * `req.validatedBody` and calls `next()`.
 *
 * @param {import('zod').ZodType} schema
 */
export function validateBody(schema) {
  return function validateBodyMiddleware(req, res, next) {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(formatZodError(parsed.error));
    }
    req.validatedBody = parsed.data;
    return next();
  };
}
