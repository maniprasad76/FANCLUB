import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import appConfig from './common/config/app.config';
import { THROTTLE_CONFIG } from './common/config/throttle.config';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { PrismaModule } from './prisma/prisma.module.js';
import { SupabaseModule } from './supabase/supabase.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ProductsModule } from './products/products.module.js';
import { CartModule } from './cart/cart.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { WishlistModule } from './wishlist/wishlist.module.js';
import { UploadModule } from './upload/upload.module.js';
import { NewsletterModule } from './newsletter/newsletter.module.js';
import { ContactModule } from './contact/contact.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { HealthModule } from './health/health.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { SanitizePipe } from './common/pipes/sanitize.pipe';

@Module({
  imports: [
    // ── Configuration ──
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),

    // ── In-Memory Cache ──
    // 5 minute default TTL, max 500 entries to prevent memory leaks.
    // Individual routes override TTL with @CacheTTL().
    CacheModule.register({
      isGlobal: true,
      ttl: 300000,  // 5 minutes (ms)
      max: 500,     // Max cached entries before LRU eviction
    }),

    // ── Rate Limiting ──
    // Default tier: 100 req / 60s per IP.
    // Controllers override with @Throttle() for stricter or looser limits.
    // @SkipThrottle() exempts health checks and webhooks.
    ThrottlerModule.forRoot(THROTTLE_CONFIG),

    // ── Feature Modules ──
    SupabaseModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    ReviewsModule,
    WishlistModule,
    UploadModule,
    NewsletterModule,
    ContactModule,
    DashboardModule,
    SettingsModule,
    HealthModule,
  ],
  providers: [
    // Global rate-limit guard — applies the 'default' tier to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_PIPE,
      useClass: SanitizePipe,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply request-ID middleware to all routes
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
