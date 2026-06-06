import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { join } from 'node:path';
import cookieParser from 'cookie-parser';

import { validateEnv } from './common/validators/validate-env';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Validate required environment variables before creating the app
  validateEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true, // Needed for Razorpay webhook signature verification
  });

  // ── Graceful Shutdown ──
  // Ensures OnModuleDestroy hooks fire when Cloud Run sends SIGTERM,
  // allowing Prisma to drain DB connections before the process exits.
  app.enableShutdownHooks();

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port', 3001);
  const env = config.get<string>('app.env', 'development');
  const frontendUrl = config.get<string>('app.frontendUrl', '');
  const adminUrl = config.get<string>('app.adminUrl', '');

  app.setGlobalPrefix('api');

  // Root endpoint — responds outside /api prefix for health checks & direct visits
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/', (_req: any, res: any) => {
    res.json({
      name: 'FAN Backend API',
      status: 'running',
      version: '1.0.0',
      environment: env,
      docs: '/api',
      health: '/api/health',
      timestamp: new Date().toISOString(),
    });
  });

  // Cookie parser middleware for httpOnly JWT cookies
  app.use(cookieParser());

  // CORS — restrict to known frontend/admin origins (purely env-driven)
  const allowedOrigins = [frontendUrl, adminUrl].filter(
    (origin): origin is string =>
      typeof origin === 'string' && origin.length > 0,
  );
  // Deduplicate
  const uniqueOrigins = [...new Set(allowedOrigins)];

  // In production, refuse to start if no origins are configured —
  // falling back to `origin: true` would allow any domain to make
  // credentialed cross-origin requests.
  if (uniqueOrigins.length === 0) {
    const msg =
      'FATAL: No CORS origins configured. Set FRONTEND_URL and/or ADMIN_URL environment variables.';
    logger.error(msg);
    throw new Error(msg);
  }

  app.enableCors({
    origin: uniqueOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/public',
  });

  const host =
    env === 'production' || process.env.RENDER ? '0.0.0.0' : 'localhost';
  await app.listen(port, host);

  logger.log(`🎬 FAN Backend v1.0.0 running on http://${host}:${port}`);
  logger.log(`   Environment: ${env}`);
  logger.log(`   Node: ${process.version}`);
  logger.log(`   CORS origins: ${uniqueOrigins.join(', ')}`);
}
bootstrap();
