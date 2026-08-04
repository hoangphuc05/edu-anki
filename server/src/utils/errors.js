/**
 * Thrown when a requested resource does not exist or is not owned by the
 * requesting user (services treat "not owned" as not found to avoid
 * resource-enumeration leaks).
 */
export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Thrown when a request is authenticated but not permitted to perform the
 * requested action.
 */
export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
