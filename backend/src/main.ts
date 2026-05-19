import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true, // Needed for Razorpay + Stripe webhook signature verification
  });

  app.setGlobalPrefix('api');

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
            'https://js.stripe.com',          // Stripe.js
          ],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
          mediaSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
          connectSrc: [
            "'self'",
            'https://*.supabase.co',
            'https://api.razorpay.com',
            'https://lux-cdn.razorpay.com',
            'https://api.stripe.com',         // Stripe API
          ],
          frameSrc: [
            "'self'",
            'https://checkout.razorpay.com',
            'https://*.supabase.co',
            'https://js.stripe.com',          // Stripe iframe
            'https://hooks.stripe.com',       // Stripe 3D Secure
          ],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images/videos to load from admin & frontend origins
    }),
  );

  // Cookie parser middleware for httpOnly JWT cookies
  app.use(cookieParser());

  // CORS — restrict to known frontend/admin origins
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    'https://tfi-frontend-kappa.vercel.app',
    'https://tfi-admin-six.vercel.app',
  ].filter(Boolean) as string[];
  // Deduplicate
  const uniqueOrigins = [...new Set(allowedOrigins)];

  app.enableCors({
    origin: uniqueOrigins.length > 0 ? uniqueOrigins : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/public',
  });

  const port = process.env.PORT || 5000;
  await app.listen(port, '0.0.0.0');
  console.log(`🎬 TFI Backend running on http://0.0.0.0:${port} (Network Exposed)`);
}
bootstrap();
