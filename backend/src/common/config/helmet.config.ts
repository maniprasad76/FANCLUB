import helmet from 'helmet';

/**
 * Helmet Configuration — Production-grade HTTP security headers.
 *
 * Configures:
 *   - X-Content-Type-Options: nosniff
 *   - X-Frame-Options: DENY (via frameguard)
 *   - Strict-Transport-Security (HSTS) — 1 year, includeSubDomains
 *   - X-XSS-Protection (legacy browser fallback)
 *   - Referrer-Policy: strict-origin-when-cross-origin
 *   - Content-Security-Policy: relaxed for API servers (no HTML pages served)
 *
 * Usage: app.use(helmetConfig()) in main.ts
 */
export function helmetConfig() {
  return helmet({
    // Prevents browsers from MIME-sniffing responses away from declared content-type
    // Restrictive CSP for API server — blocks injection on any rendered responses
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        scriptSrc: ["'none'"],
        styleSrc: ["'unsafe-inline'"], // Swagger UI needs inline styles in dev
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disabled — frontend loads images cross-origin
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow frontend to load API resources

    // Clickjacking protection — deny all framing
    frameguard: { action: 'deny' },

    // HSTS — force HTTPS for 1 year (only in production)
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },

    // Disable MIME-type sniffing
    noSniff: true,

    // Referrer policy — send origin for cross-origin, full URL for same-origin
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

    // Hide X-Powered-By header to reduce attack surface fingerprinting
    hidePoweredBy: true,

    // XSS filter — legacy browser protection
    xssFilter: true,
  });
}
