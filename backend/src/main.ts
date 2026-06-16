import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { join } from 'node:path';
import cookieParser from 'cookie-parser';

import { validateEnv } from './common/validators/validate-env';
import { helmetConfig } from './common/config/helmet.config';

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
  const isProduction = env === 'production';
  const frontendUrl = config.get<string>('app.frontendUrl', '');
  const adminUrl = config.get<string>('app.adminUrl', '');

  app.setGlobalPrefix('api');

  // ── Security Headers (Helmet) ──
  // Production-grade HTTP headers: HSTS, X-Content-Type-Options, X-Frame-Options, etc.
  app.use(helmetConfig());

  // Root endpoint — responds outside /api prefix for health checks & direct visits
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/', (_req: any, res: any) => {
    res.json({
      name: 'FAN Backend API',
      status: 'running',
      version: '1.0.0',
      environment: env,
      docs: '/api/docs',
      health: '/api/health',
      timestamp: new Date().toISOString(),
    });
  });

  // Cookie parser middleware for httpOnly JWT cookies
  app.use(cookieParser());

  const parseOrigins = (urlStr: string): string[] =>
    (urlStr || '').split(',').map(s => s.trim()).filter(s => s.length > 0);

  const allowedOrigins = [
    ...parseOrigins(frontendUrl),
    ...parseOrigins(adminUrl),
    'https://tfi-admin-six.vercel.app',
    'https://tfi-frontend-kappa.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
  ];
  const uniqueOrigins = [...new Set(allowedOrigins)];

  if (uniqueOrigins.length === 0) {
    if (isProduction) {
      logger.error(
        '🚫 FATAL: No CORS origins configured in production. Set FRONTEND_URL and ADMIN_URL environment variables.',
      );
      // In production, still allow startup but with strict warning — the service
      // won't be usable from any frontend without proper CORS.
      logger.warn(
        '⚠️ API will reject all cross-origin requests until CORS origins are configured.',
      );
    } else {
      logger.warn(
        '⚠️ No CORS origins configured. Defaulting to allow all origins (*) for development.',
      );
      uniqueOrigins.push('*');
    }
  }

  app.enableCors({
    origin: (requestOrigin, callback) => {
      // Allow requests with no origin (e.g., server-to-server or curl)
      if (!requestOrigin) return callback(null, true);

      // Always allow any Vercel preview or production app
      if (requestOrigin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      // Allow configured origins
      if (uniqueOrigins.includes(requestOrigin)) {
        return callback(null, true);
      }

      // Default fallback
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-Id',
      'Accept',
    ],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 86400, // Preflight cache: 24 hours
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

  // ── Swagger / OpenAPI Documentation ──
  // Interactive API docs served at /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FANCLUB API')
    .setDescription(
      'REST API for the FANCLUB e-commerce platform — fandom-inspired streetwear. ' +
        'Covers authentication, products, orders, payments (Razorpay), cart, wishlist, ' +
        'reviews, admin dashboard, and more.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your Supabase JWT access token',
      },
      'JWT-Auth',
    )
    .addTag('Auth', 'Authentication — signup, signin, OAuth, token refresh')
    .addTag('Users', 'User profile and account management')
    .addTag('Products', 'Product catalog — CRUD, filtering, featured')
    .addTag('Categories', 'Product category management')
    .addTag('Cart', 'Shopping cart operations')
    .addTag('Orders', 'Order lifecycle — create, status updates, history')
    .addTag(
      'Payments',
      'Razorpay payment gateway — orders, verification, webhooks',
    )
    .addTag('Reviews', 'Product reviews — create, list, moderate')
    .addTag('Wishlist', 'Saved products wishlist')
    .addTag('Upload', 'File upload to Supabase Storage')
    .addTag('Newsletter', 'Email subscription management')
    .addTag('Contact', 'Contact form submissions')
    .addTag('Dashboard', 'Admin analytics — sales, KPIs, charts')
    .addTag('Settings', 'Store configuration')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'FANCLUB API Docs',
  });

  logger.log(`📚 Swagger docs available at /api/docs`);

  const host =
    env === 'production' || process.env.RENDER ? '0.0.0.0' : 'localhost';
  await app.listen(port, host);

  logger.log(`🎬 FAN Backend v1.0.0 running on http://${host}:${port}`);
  logger.log(`   Environment: ${env}`);
  logger.log(`   Node: ${process.version}`);
  logger.log(
    `   CORS origins: ${uniqueOrigins.join(', ') || '(none — rejecting all)'}`,
  );
  logger.log(`   Security headers: ✅ Helmet enabled`);
  logger.log(`   API docs: http://${host}:${port}/api/docs`);
}
bootstrap();
