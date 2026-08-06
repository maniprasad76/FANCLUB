# FANCLUB Backend API

NestJS 11 REST API powering the FANCLUB storefront and admin panel.

## Tech Stack

- **NestJS 11** + **TypeScript 5**
- **Prisma 7** ORM over Supabase PostgreSQL
- **Supabase Auth** (JWT) with RBAC (`ADMIN` / `USER`)
- **Razorpay** payments with webhook verification
- **Redis** caching/throttling with in-memory fallback
- **Helmet**, tiered rate limiting, input sanitization, audit logging

## Getting Started

```bash
npm install
cp .env.example .env   # fill in your values
npx prisma generate
npm run dev
```

Server: `http://localhost:3001` · Swagger docs: `http://localhost:3001/api`

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start in watch mode |
| `npm run build` | Clean + Prisma generate + Nest build |
| `npm run start:prod` | Run compiled build |
| `npm test` | Run unit tests (Jest) |
| `npm run lint` | Lint and auto-fix |
| `npm run seed` | Run the direct seed script |
| `npm run seed:settings` | Backfill `data/settings.json` into the `settings` table |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:push` | Apply schema to the DB (`prisma db push`) |

## Deployment

Deployed via Render using the root `render.yaml` (service `rootDir: backend`).
Schema changes are applied with `npm run prisma:push` (`prisma db push`) — the
repo has no `prisma/migrations/` folder, so `migrate deploy` is not used.
See `prisma/manual-20260804-audit-fixes.sql` for the latest audit-fix migration.

## Project Layout

```
src/
├── auth/          # Authentication, JWT guards, account lockout
├── audit/         # Audit log module + decorator
├── cart/          # Shopping cart
├── categories/    # Product categories
├── common/        # Config, guards, interceptors, middleware, pipes, services
├── contact/       # Contact form
├── coupons/       # Promo coupons
├── dashboard/     # Admin analytics
├── health/        # Liveness/readiness probes
├── loyalty/       # Stamp-card loyalty program
├── newsletter/    # Newsletter subscriptions
├── orders/        # Order lifecycle, expiry, refunds
├── payments/      # Razorpay integration
├── prisma/        # Prisma client
├── products/      # Catalog CRUD + search
├── reviews/       # Product reviews
├── settings/      # DB-backed store configuration
├── supabase/      # Supabase client
├── upload/        # File uploads
├── users/         # User management
└── wishlist/      # Wishlist
```

See the [root README](../README.md) for full project documentation.
