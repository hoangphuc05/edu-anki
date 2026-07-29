import { z } from 'zod';

/**
 * Schema for POST /api/auth/register request bodies.
 */
export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Must be a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must be at most 128 characters long'),
});

/**
 * Schema for POST /api/auth/login request bodies.
 */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Must be a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
