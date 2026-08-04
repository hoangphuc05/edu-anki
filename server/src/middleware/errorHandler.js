/**
 * Centralized Express error-handling middleware. Must be registered last
 * (after all routes) since Express identifies error middleware by arity.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(500).json({
    error: 'InternalServerError',
    message: 'Something went wrong',
  });
}
