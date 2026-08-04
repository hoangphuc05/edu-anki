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

/**
 * Schema for POST /api/decks request bodies.
 */
export const deckCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be at most 200 characters long'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must be at most 2000 characters long')
    .optional()
    .nullable(),
});

/**
 * Schema for PUT /api/decks/:deckId request bodies. All fields are optional,
 * but at least one field must be present.
 */
export const deckUpdateSchema = deckCreateSchema
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, { message: 'At least one field must be provided' });

/**
 * Schema for POST /api/decks/:deckId/cards request bodies.
 */
export const cardCreateSchema = z.object({
  question: z.string().trim().min(1, 'Question is required').max(2000, 'Question must be at most 2000 characters long'),
  answer: z.string().trim().min(1, 'Answer is required').max(2000, 'Answer must be at most 2000 characters long'),
  tags: z.array(z.string().trim().min(1, 'Tags must not be empty')).optional(),
});

/**
 * Schema for PUT /api/cards/:cardId request bodies. All fields are optional,
 * but at least one field must be present.
 */
export const cardUpdateSchema = cardCreateSchema
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, { message: 'At least one field must be provided' });
