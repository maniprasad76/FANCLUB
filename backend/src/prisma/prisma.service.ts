import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new pg.Pool(PrismaService.buildPoolConfig(connectionString));
    const adapter = new PrismaPg(pool);
    super({ adapter });

    // pg.Pool emits an 'error' event when a pooled client fails (e.g. idle
    // connection dropped or connect timeout). Without a listener, Node treats
    // it as an uncaught exception and kills the whole process.
    pool.on('error', (err) => {
      this.logger.error(`PostgreSQL pool error: ${err?.message || err}`);
    });
  }

  /**
   * Robust pg.Pool config for the DATABASE_URL:
   * - Explicit `sslmode` in the URL is honored as-is (pg handles it).
   * - Remote hosts without an explicit sslmode (e.g. Supabase) get TLS
   *   enabled automatically — managed Postgres rejects plaintext connects.
   * - Local hosts (localhost / 127.0.0.1 / ::1) stay on plaintext for local dev.
   */
  private static buildPoolConfig(connectionString?: string): pg.PoolConfig {
    const config: pg.PoolConfig = {
      connectionString,
      connectionTimeoutMillis: 30_000,
      idleTimeoutMillis: 30_000,
      max: 10,
    };
    try {
      const parsed = new URL(connectionString || '');
      const search = new URLSearchParams(parsed.search);
      const host = (parsed.hostname || '').replace(/^\[|\]$/g, '');
      const isLocal = ['localhost', '127.0.0.1', '::1'].includes(host);
      const isSupabaseHost =
        host.endsWith('.supabase.co') || host.endsWith('.pooler.supabase.com');
      const hasExplicitSslMode = search.has('sslmode');
      if (!hasExplicitSslMode && !isLocal && isSupabaseHost) {
        config.ssl = { rejectUnauthorized: false };
      }
    } catch {
      // Malformed URL — let pg surface the real connection error.
    }
    return config;
  }

  async onModuleInit() {
    this.logger.log('🔌 Connecting Prisma to PostgreSQL database pool...');
    await this.$connect();
    this.logger.log('✅ Prisma connected successfully.');

    // The driver-adapter pool can report 'connected' before credentials are
    // actually validated — run a trivial query so a bad DATABASE_URL fails
    // fast at boot with a clear, actionable message instead of crashing later.
    try {
      await this.$queryRaw`SELECT 1`;
    } catch (err: any) {
      const message = err?.message || '';
      const code = err?.code || '';
      if (
        code === 'P1000' ||
        /password authentication|28P01|28000/i.test(message)
      ) {
        throw new Error(
          `🚫 FATAL: Database authentication failed — PostgreSQL rejected the credentials in DATABASE_URL (backend/.env). Reset your Supabase database password (Dashboard → Settings → Database) and update DATABASE_URL. Underlying error: ${message}`,
        );
      }
      this.logger.error(`⚠️  Database sanity check failed: ${message}`);
    }
  }

  async onModuleDestroy() {
    this.logger.log(
      '🔌 Disconnecting Prisma from PostgreSQL database pool (graceful shutdown)...',
    );
    await this.$disconnect();
    this.logger.log('✅ Prisma disconnected successfully.');
  }
}
