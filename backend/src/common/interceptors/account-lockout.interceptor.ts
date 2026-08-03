import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { RedisService } from '../services/redis.service.js';
import { AuthService } from '../../auth/auth.service.js';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface LockoutEntry {
  attempts: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

@Injectable()
export class AccountLockoutInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AccountLockoutInterceptor.name);
  private readonly inMemoryStore = new Map<string, LockoutEntry>();

  constructor(
    private readonly redisService: RedisService,
    private readonly authService: AuthService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    const email = request.body?.email?.toLowerCase();

    if (!email) {
      return next.handle();
    }

    const now = Date.now();
    const entry = await this.getEntry(email);

    // 1. Check if currently locked out
    if (entry.lockedUntil && now < entry.lockedUntil) {
      this.logger.warn(`🔒 Request blocked due to lockout — email=${email}`);
      throw new UnauthorizedException(
        'Invalid email or password. Please try again.',
      );
    }

    // 2. Check if under progressive delay
    if (entry.attempts > 0 && entry.attempts < MAX_ATTEMPTS) {
      const delay = Math.pow(2, entry.attempts - 1) * 1000; // 1s, 2s, 4s, 8s
      const allowedTime = entry.lastAttempt + delay;
      if (now < allowedTime) {
        this.logger.warn(
          `⏳ Request blocked due to progressive delay — email=${email} delay=${delay}ms`,
        );
        throw new UnauthorizedException(
          'Invalid email or password. Please try again.',
        );
      }
    }

    return next.handle().pipe(
      tap(() => {
        // Successful login: reset attempts
        this.deleteEntry(email);
      }),
      catchError((err) => {
        // Only track auth failures (401 Unauthorized)
        if (
          err instanceof UnauthorizedException ||
          (err && err.status === 401)
        ) {
          this.recordFailure(email, now);
        }
        return throwError(() => err);
      }),
    );
  }

  private async getEntry(email: string): Promise<LockoutEntry> {
    const client = this.redisService.getClient();
    if (client) {
      try {
        const data = await client.get(`lockout:${email}`);
        if (data) {
          return JSON.parse(data);
        }
      } catch (err: any) {
        this.logger.error(`Redis get error: ${err.message}`);
      }
    }
    return (
      this.inMemoryStore.get(email) || {
        attempts: 0,
        lastAttempt: 0,
        lockedUntil: null,
      }
    );
  }

  private async setEntry(email: string, entry: LockoutEntry): Promise<void> {
    const client = this.redisService.getClient();
    if (client) {
      try {
        // Keep Redis key TTL slightly longer than window (e.g. 20 minutes)
        await client.set(`lockout:${email}`, JSON.stringify(entry), 'EX', 1200);
        return;
      } catch (err: any) {
        this.logger.error(`Redis set error: ${err.message}`);
      }
    }
    this.inMemoryStore.set(email, entry);
  }

  private async deleteEntry(email: string): Promise<void> {
    const client = this.redisService.getClient();
    if (client) {
      try {
        await client.del(`lockout:${email}`);
        return;
      } catch (err: any) {
        this.logger.error(`Redis delete error: ${err.message}`);
      }
    }
    this.inMemoryStore.delete(email);
  }

  private async recordFailure(email: string, now: number): Promise<void> {
    const entry = await this.getEntry(email);
    entry.attempts += 1;
    entry.lastAttempt = now;

    if (entry.attempts >= MAX_ATTEMPTS) {
      entry.lockedUntil = now + WINDOW_MS;
      this.logger.warn(
        `🔒 Account locked after ${MAX_ATTEMPTS} failed attempts — email=${email}`,
      );

      // Trigger password reset email asynchronously
      this.authService
        .forgotPassword(email)
        .then(() => {
          this.logger.log(
            `📧 Lockout reset email triggered successfully for ${email}`,
          );
        })
        .catch((emailErr) => {
          this.logger.error(
            `❌ Failed to send lockout reset email to ${email}: ${emailErr.message}`,
          );
        });
    } else {
      const nextDelay = Math.pow(2, entry.attempts - 1);
      this.logger.warn(
        `⚠️ Failed login attempt ${entry.attempts} for ${email}. Next attempt delayed by ${nextDelay}s`,
      );
    }

    await this.setEntry(email, entry);
  }
}
