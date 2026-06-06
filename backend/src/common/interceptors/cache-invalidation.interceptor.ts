import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Observable, tap } from 'rxjs';

/**
 * CacheInvalidationInterceptor — Clears the entire in-memory cache
 * after any successful write operation (POST, PUT, PATCH, DELETE).
 *
 * Why full reset instead of surgical key deletion?
 *   - Admin writes are infrequent (a few per day at most)
 *   - Product listing cache keys contain serialized query params, making
 *     prefix-based deletion fragile
 *   - The cache rebuilds in <100ms on the next read — no user impact
 *
 * Apply to admin-only controllers that modify cached entities.
 */
@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInvalidationInterceptor.name);

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only intercept write operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap({
          next: () => {
            // Fire-and-forget cache clear — don't block the response
            this.cache.clear().then(() => {
              this.logger.log(
                `Cache invalidated after ${method} ${request.url}`,
              );
            });
          },
        }),
      );
    }

    return next.handle();
  }
}
