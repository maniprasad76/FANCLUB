import { Logger } from '@nestjs/common';

/**
 * validateEnv — Validates that all required environment variables are set
 * before the application boots. Fails fast with a clear error listing
 * exactly which variables are missing.
 *
 * Call this from main.ts BEFORE NestFactory.create().
 */
export function validateEnv(): void {
  const logger = new Logger('EnvValidation');

  // Required for the application to function
  const required: string[] = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  // Required for CORS — at least one must be set
  const corsVars = ['FRONTEND_URL', 'ADMIN_URL'];

  // Optional but logged if missing
  const recommended: string[] = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];

  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required vars
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Check CORS vars — at least one must be set
  const hasCorsOrigin = corsVars.some(
    (key) => process.env[key] && process.env[key].length > 0,
  );
  if (!hasCorsOrigin) {
    missing.push(`At least one of: ${corsVars.join(', ')}`);
  }

  // Check recommended vars
  for (const key of recommended) {
    if (
      !process.env[key] ||
      process.env[key].startsWith('your-') ||
      process.env[key].startsWith('sk_test_your_')
    ) {
      warnings.push(key);
    }
  }

  // Report warnings (non-fatal)
  if (warnings.length > 0) {
    logger.warn(
      `⚠️  Optional env vars not configured (features will be stubbed): ${warnings.join(', ')}`,
    );
  }

  // Report missing (fatal)
  if (missing.length > 0) {
    const msg = `🚫 FATAL: Missing required environment variables:\n${missing.map((v) => `   • ${v}`).join('\n')}\n\nSet these in your .env file or deployment environment.`;
    logger.error(msg);
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  logger.log('✅ Environment validation passed');
}
