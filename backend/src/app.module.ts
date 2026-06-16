import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';

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
import { CouponsModule } from './coupons/coupons.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { SanitizePipe } from './common/pipes/sanitize.pipe';

// Redis & Audit Log imports
import { RedisModule } from './common/services/redis.module.js';
import { RedisService } from './common/services/redis.service.js';
import { RedisFallbackCacheStore } from './common/services/redis-fallback-cache.store.js';
import { RedisFallbackThrottlerStorage } from './common/services/redis-fallback-throttler.storage.js';
import { AuditModule } from './audit/audit.module.js';
import { AuditInterceptor } from './common/interceptors/audit.interceptor.js';

@Module({
  imports: [
    // ── Configuration ──
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),

    // ── Event Emitter (Async Job Processing) ──
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
    }),

    // ── Redis Connection Module ──
    RedisModule,

    // ── Resilient Caching Store (Redis with In-Memory Fallback) ──
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [RedisService],
      useFactory: (redisService: RedisService) => ({
        stores: new RedisFallbackCacheStore(() => redisService.getClient()),
        ttl: 300000, // 5 minutes (ms)
        max: 500, // Max cached entries before LRU eviction on memory fallback
      }),
    }),

    // ── Resilient Rate Limiting Store (Redis with In-Memory Fallback) ──
    ThrottlerModule.forRootAsync({
      inject: [RedisService],
      useFactory: (redisService: RedisService) => ({
        throttlers: THROTTLE_CONFIG,
        storage: new RedisFallbackThrottlerStorage(() =>
          redisService.getClient(),
        ),
      }),
    }),

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
    AuditModule,
    CouponsModule,
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
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
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
    consumer.apply(RequestIdMiddleware).forRoutes('*path');
  }
}
