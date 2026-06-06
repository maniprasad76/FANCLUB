import { registerAs } from '@nestjs/config';

/**
 * Typed application configuration — single source of truth for all env vars.
 *
 * Usage in any service:
 *   constructor(private config: ConfigService) {}
 *   this.config.get('app.port')
 *   this.config.get('supabase.url')
 *   this.config.get('razorpay.keyId')
 */
export default registerAs('app', () => ({
  // ── Server ──
  port: parseInt(process.env.PORT || '3001', 10),
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // ── CORS Origins ──
  frontendUrl: process.env.FRONTEND_URL || '',
  adminUrl: process.env.ADMIN_URL || '',

  // ── Database ──
  database: {
    url: process.env.DATABASE_URL || '',
    directUrl: process.env.DIRECT_URL || '',
  },

  // ── Supabase ──
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    jwtSecret: process.env.SUPABASE_JWT_SECRET || '',
  },

  // ── Razorpay ──
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },

  // ── Admin Seeder ──
  admin: {
    email: process.env.ADMIN_EMAIL || '',
    password: process.env.ADMIN_PASSWORD || '',
  },
}));
