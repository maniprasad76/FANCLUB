import { z } from 'zod';

/**
 * Sanitization Helpers
 */

function sanitizeEmail(val: any): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/javascript\s*:/gi, '') // Strip javascript: protocol
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Strip inline event handlers
    .trim()
    .toLowerCase();
}

function sanitizePassword(val: any): string {
  if (typeof val !== 'string') return '';
  // Strip HTML and script tags to prevent stored/logged XSS, but preserve special characters
  return val
    .replace(/<[^>]*>/g, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .trim();
}

function sanitizeUsername(val: any): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<[^>]*>/g, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/[^a-zA-Z0-9_-]/g, '') // Keep only alphanumeric, hyphens, and underscores
    .trim();
}

function sanitizeDisplayName(val: any): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<[^>]*>/g, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/[^a-zA-Z0-9\s.-]/g, '') // Keep only alphanumeric, spaces, hyphens, dots
    .trim();
}

/**
 * Validation Schemas
 */

export const SignUpSchema = z.object({
  email: z.preprocess(
    (val) => sanitizeEmail(val),
    z.string().email('Invalid email format').max(100, 'Email too long'),
  ),
  password: z.preprocess(
    (val) => sanitizePassword(val),
    z
      .string()
      .min(8, 'Password too short')
      .max(128, 'Password too long')
      .refine(
        (val) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W])/.test(val),
        'Password complexity not met',
      ),
  ),
  name: z.preprocess(
    (val) => sanitizeDisplayName(val),
    z.string().min(2, 'Name too short').max(100, 'Name too long'),
  ),
  username: z.preprocess(
    (val) =>
      typeof val === 'string' && val.trim()
        ? sanitizeUsername(val)
        : undefined,
    z
      .string()
      .min(3, 'Username too short')
      .max(30, 'Username too long')
      .optional(),
  ),
  displayName: z.preprocess(
    (val) =>
      typeof val === 'string' && val.trim()
        ? sanitizeDisplayName(val)
        : undefined,
    z
      .string()
      .min(2, 'Display name too short')
      .max(100, 'Display name too long')
      .optional(),
  ),
});

export const SignInSchema = z.object({
  email: z.preprocess(
    (val) => sanitizeEmail(val),
    z.string().email('Invalid email format').max(100, 'Email too long'),
  ),
  password: z.preprocess(
    (val) => sanitizePassword(val),
    z.string().min(1, 'Password is required'),
  ),
});
