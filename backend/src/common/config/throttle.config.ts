/**
 * Throttle Configuration — Tiered rate-limiting for the FAN Club API.
 *
 * Three tiers:
 *   - default:  100 req / 60s — general authenticated API usage
 *   - strict:     5 req / 60s — abuse-prone public endpoints (auth, contact, newsletter)
 *   - webhook:  200 req / 60s — server-to-server callbacks (Razorpay)
 *
 * These constants are used in ThrottlerModule.forRoot() and can be
 * overridden per-controller or per-route with @Throttle().
 */

export const THROTTLE_DEFAULT = {
  name: 'default',
  ttl: 60000, // 60 seconds
  limit: 100,
};

export const THROTTLE_STRICT = {
  name: 'strict',
  ttl: 60000,
  limit: 5,
};

export const THROTTLE_WEBHOOK = {
  name: 'webhook',
  ttl: 60000,
  limit: 200,
};

export const THROTTLE_CONFIG = [
  THROTTLE_DEFAULT,
  THROTTLE_STRICT,
  THROTTLE_WEBHOOK,
];
