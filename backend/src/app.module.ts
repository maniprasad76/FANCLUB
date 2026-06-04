import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
    ConfigModule.forRoot({ isGlobal: true }),

    // Global rate limiting — 100 requests per minute per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds window
        limit: 100, // max 100 requests per window
      },
    ]),

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
