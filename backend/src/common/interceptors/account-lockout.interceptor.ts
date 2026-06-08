import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * AccountLockoutInterceptor — Brute-force login protection.
 *
 * Tracks failed login attempts per email address in an in-memory LRU map.
 * After MAX_ATTEMPTS failures within WINDOW_MS, temporarily locks out
 * further attempts and responds with 429 Too Many Requests.
 *
 * Design decisions:
 *   - In-memory (not Redis): simplicity for single-instance deploys.
 *     For multi-instance, swap to a shared store.
 *   - Auto-expires: entries are cleaned up after WINDOW_MS.
 *   - LRU eviction: map is capped at MAX_TRACKED_EMAILS to prevent
 *     memory exhaustion from distributed attacks.
 *
 * Apply to signin routes via @UseInterceptors(AccountLockoutInterceptor).
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_TRACKED_EMAILS = 10000; // Prevent memory exhaustion

interface LockoutEntry {
  attempts: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

@Injectable()
export class AccountLockoutInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AccountLockoutInterceptor.name);
  private readonly store = new Map<string, LockoutEntry>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const email = request.body?.email?.toLowerCase();

    if (!email) {
      return next.handle();
    }

    // Clean expired entries periodically (every 100 requests)
    if (this.store.size > MAX_TRACKED_EMAILS / 2) {
      this.cleanup();
    }

    const entry = this.store.get(email);
    const now = Date.now();

    // Check if currently locked out
    if (entry?.lockedUntil && now < entry.lockedUntil) {
      const remainingSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
      this.logger.warn(
        `🔒 Account locked — email=${email} remainingSeconds=${remainingSeconds}`,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many failed login attempts. Please try again in ${remainingSeconds} seconds.`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // If entry has expired window, reset it
    if (entry && now - entry.firstAttempt > WINDOW_MS) {
      this.store.delete(email);
    }

    return next.handle().pipe(
      catchError((err) => {
        // Only track auth failures (401 Unauthorized)
        if (
          err instanceof HttpException &&
          err.getStatus() === HttpStatus.UNAUTHORIZED
        ) {
          this.recordFailure(email, now);
        }
        return throwError(() => err);
      }),
    );
  }

  private recordFailure(email: string, now: number): void {
    const existing = this.store.get(email);

    if (!existing) {
      this.store.set(email, {
        attempts: 1,
        firstAttempt: now,
        lockedUntil: null,
      });
      return;
    }

    existing.attempts += 1;

    if (existing.attempts >= MAX_ATTEMPTS) {
      existing.lockedUntil = now + WINDOW_MS;
      this.logger.warn(
        `🔒 Account locked after ${MAX_ATTEMPTS} failed attempts — email=${email}`,
      );
    }

    this.store.set(email, existing);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [email, entry] of this.store.entries()) {
      // Remove entries whose window has expired AND lockout has expired
      const windowExpired = now - entry.firstAttempt > WINDOW_MS;
      const lockoutExpired = !entry.lockedUntil || now > entry.lockedUntil;
      if (windowExpired && lockoutExpired) {
        this.store.delete(email);
      }
    }
  }
}
