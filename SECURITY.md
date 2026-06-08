# Security Policy — FANCLUB (TFI)

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅ Actively supported |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

### How to Report

1. **Do NOT** open a public GitHub issue for security vulnerabilities.
2. Email the security team at: **security@fanclub.in** (or contact via GitHub private advisory)
3. Include:
   - A detailed description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours of your report
- **Assessment**: Within 7 days, we'll assess severity and impact
- **Fix timeline**: Critical/High severity issues patched within 14 days
- **Credit**: Reporters will be credited in the release notes (unless you prefer anonymity)

## Security Measures

This project implements the following security measures:

### Authentication & Authorization
- **Supabase Auth** with JWT token validation
- **Role-Based Access Control (RBAC)** with `ADMIN` and `USER` roles
- **Account lockout** after 5 failed login attempts (15-minute window)
- **Token refresh** with automatic retry queuing
- **Admin audit trail** logging for all administrative actions

### API Security
- **Helmet.js** — HTTP security headers (HSTS, X-Content-Type-Options, X-Frame-Options)
- **Rate limiting** — Tiered throttling (100 req/min general, 5 req/min auth)
- **Input sanitization** — Global XSS prevention pipe strips HTML/script tags
- **CORS** — Strict origin whitelisting (no wildcard in production)
- **Request IDs** — UUID correlation for distributed tracing
- **Validation** — `class-validator` with `whitelist: true` and `forbidNonWhitelisted: true`

### Infrastructure
- **Multi-stage Docker builds** with non-root user
- **Graceful shutdown** hooks for database connection draining
- **Environment validation** — fail-fast on missing/invalid config
- **Health checks** — Liveness and readiness probes
- **Dependency auditing** — `npm audit` in CI pipeline + Dependabot

### Data Protection
- **No raw secrets in code** — all credentials via environment variables
- **`.env` files in `.gitignore`** — only `.env.example` is committed
- **Supabase Storage** — signed URLs for file access
- **Prisma ORM** — parameterized queries prevent SQL injection
- **Cookie security** — `httpOnly`, `secure`, `sameSite` flags

## Dependencies

We actively monitor dependencies for known vulnerabilities using:
- GitHub Dependabot (automated PRs)
- `npm audit` in CI pipeline
- Regular manual reviews
