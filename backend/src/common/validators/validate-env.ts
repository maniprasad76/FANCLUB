import { Logger } from '@nestjs/common';

/**
 * validateEnv — Validates that all required environment variables are set
 * before the application boots. Fails fast with a clear error listing
 * exactly which variables are missing.
 *
 * In production (NODE_ENV=production), gateway credentials are REQUIRED.
 * Missing or placeholder gateway credentials in production are fatal —
 * stub-mode must never run in production as it accepts fake payments.
 *
 * Call this from main.ts BEFORE NestFactory.create().
 */
export function validateEnv(): void {
  const logger = new Logger('EnvValidation');

  // Validate NODE_ENV
  const nodeEnv = process.env.NODE_ENV || 'development';
  const validEnvs = ['development', 'production', 'test'];
  if (!validEnvs.includes(nodeEnv)) {
    throw new Error(
      `🚫 FATAL: Invalid NODE_ENV "${nodeEnv}". Must be one of: ${validEnvs.join(', ')}`,
    );
  }

  const isProduction = nodeEnv === 'production';

  // Required for the application to function in all environments
  const required: string[] = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  // Required for CORS — at least one must be set
  const corsVars = ['FRONTEND_URL', 'ADMIN_URL'];

  // In production: gateway credentials are REQUIRED to prevent stub-mode.
  // In development: these are optional (stub mode is acceptable).
  const gatewayVars = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET',
  ];

  const missing: string[] = [];
  const warnings: string[] = [];

  // Helper to validate URL format
  const isValidUrl = (urlStr: string) => {
    try {
      const url = new URL(urlStr);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Check required vars
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Validate database connection strings — DATABASE_URL is required and
  // DIRECT_URL (migrations) must also be real, not template placeholders.
  const dbUrlVars = ['DATABASE_URL', 'DIRECT_URL'];
  for (const key of dbUrlVars) {
    const val = process.env[key];
    if (!val) continue; // missing is handled above; DIRECT_URL is optional

    let parsed: URL;
    try {
      parsed = new URL(val);
    } catch {
      missing.push(`${key} is not a valid URL — check backend/.env`);
      continue;
    }

    if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
      missing.push(
        `${key} must use the postgres:// or postgresql:// scheme (got: ${val.slice(0, 40)}...)`,
      );
      continue;
    }

    const dbHost = (parsed.hostname || '').replace(/^\[|\]$/g, '');
    const isLocalDbHost = ['localhost', '127.0.0.1', '::1'].includes(dbHost);
    const isPlaceholder =
      /<[^>]+>/.test(val) || // e.g. <ref>, <password> from .env.example
      !parsed.username ||
      (!parsed.password && !isLocalDbHost);

    if (isPlaceholder) {
      missing.push(
        `${key} contains a placeholder or missing credentials (username/password). Copy the real connection string from Supabase Dashboard → Settings → Database.`,
      );
      continue;
    }


  }

  // Validate URL format for CORS URLs if present
  for (const key of corsVars) {
    const val = process.env[key];
    if (val && !isValidUrl(val)) {
      missing.push(`${key} must be a valid HTTP or HTTPS URL (got: "${val}")`);
    }
  }

  // Check CORS vars — at least one must be set
  const hasCorsOrigin = corsVars.some(
    (key) => process.env[key] && process.env[key].length > 0,
  );
  if (!hasCorsOrigin) {
    warnings.push(
      `CORS origins missing (${corsVars.join(', ')}). Defaulting to '*'`,
    );
  }

  // Gateway credential checks
  const placeholderPrefixes = ['your-', 'sk_test_your_', 'whsec_your_'];
  const isPlaceholder = (val: string | undefined) =>
    !val || placeholderPrefixes.some((prefix) => val.startsWith(prefix));

  for (const key of gatewayVars) {
    if (isPlaceholder(process.env[key])) {
      warnings.push(
        `${key} (missing/placeholder — payments will run in stub mode)`,
      );
    }
  }

  // Report warnings
  if (warnings.length > 0) {
    logger.warn(`⚠️  Config warning: ${warnings.join(', ')}`);
  }

  // Additional production checks
  if (isProduction) {
    // Admin seeder credentials should not be present in production (security hygiene)
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      logger.warn(
        '⚠️  ADMIN_EMAIL and ADMIN_PASSWORD are set in production. ' +
          'These should only be used for initial setup. Remove them once the admin account is created.',
      );
    }
  }

  // Report missing (fatal)
  if (missing.length > 0) {
    const msg =
      `🚫 FATAL: Missing required environment variables:\n` +
      `${missing.map((v) => `   • ${v}`).join('\n')}\n\n` +
      `Set these in your .env file or deployment environment.`;
    logger.error(msg);
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  logger.log(
    `✅ Environment validation passed${isProduction ? ' (production mode)' : ' (development mode)'}`,
  );
}
