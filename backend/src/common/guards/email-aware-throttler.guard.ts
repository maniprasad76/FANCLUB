import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * EmailAwareThrottlerGuard — keys throttling on BOTH the client IP and the
 * account being targeted (when the request body carries an email).
 *
 * MED 12: The default ThrottlerGuard keys purely on IP, so a shared IP
 * (office NAT, mobile carrier) can exhaust the auth limit and lock out
 * OTHER users on the same IP. Keying on `ip:email` scopes the limit to a
 * single account while still bounding brute-force traffic per source.
 *
 * Account-level brute-force protection itself is handled by
 * AccountLockoutInterceptor (5 failed attempts → 15 min lockout), so this
 * guard is intentionally permissive enough to avoid collateral lockouts.
 */
@Injectable()
export class EmailAwareThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const email = req?.body?.email?.toLowerCase();
    const ip = req.ips?.length ? req.ips[0] : req.ip;
    return email ? `${ip}:${email}` : ip || 'unknown';
  }
}
