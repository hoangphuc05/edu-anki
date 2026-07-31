/**
 * Convert a failed Zod safeParse result into a consistent JSON error payload.
 *
 * @param {import('zod').ZodSafeParseError<unknown>} error - the `.error` from a failed safeParse
 * @returns {{ error: string, message: string, details: Record<string, string[]> }}
 */
export function formatZodError(error) {
  return {
    error: 'ValidationError',
    message: 'Invalid request body',
    details: error.flatten().fieldErrors,
  };
}
