import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'node:path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { validateEnv } from './common/validators/validate-env';

async function bootstrap() {
  // Validate required environment variables before creating the app
  validateEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true, // Needed for Razorpay + Stripe webhook signature verification
  });

  app.setGlobalPrefix('api');

  // Root endpoint — responds outside /api prefix for health checks & direct visits
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/', (_req: any, res: any) => {
    res.json({
      name: 'FAN Backend API',
      status: 'running',
      version: '1.0.0',
      docs: '/api',
      health: '/api/health',
      timestamp: new Date().toISOString(),
    });
  });

  // Security headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://checkout.razorpay.com',
            'https://js.stripe.com', // Stripe.js
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
          ],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
          mediaSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
          connectSrc: [
            "'self'",
            'https://*.supabase.co',
            'https://api.razorpay.com',
            'https://lux-cdn.razorpay.com',
            'https://api.stripe.com', // Stripe API
          ],
          frameSrc: [
            "'self'",
            'https://checkout.razorpay.com',
            'https://*.supabase.co',
            'https://js.stripe.com', // Stripe iframe
            'https://hooks.stripe.com', // Stripe 3D Secure
          ],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images/videos to load from admin & frontend origins
      hsts: {
        maxAge: 63072000, // 2 years in seconds
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // Cookie parser middleware for httpOnly JWT cookies
  app.use(cookieParser());

  // CORS — restrict to known frontend/admin origins (purely env-driven)
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
  ].filter(
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
    console.error(msg);
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

  const port = process.env.PORT || 5000;
  const host =
    process.env.NODE_ENV === 'production' || process.env.RENDER
      ? '0.0.0.0'
      : 'localhost';
  await app.listen(port, host);
  console.log(`🎬 FAN Backend running on http://${host}:${port}`);
}
bootstrap();
