---
name: fan-project-context
description: "Project architecture and conventions for FAN Club e-commerce platform. ACTIVATE when: working on any FAN feature, creating new modules/components/pages, debugging project-specific issues, asking about project structure, understanding business logic (orders, payments, refunds), or when needing context about file naming, module organization, environment variables, or deployment targets. This is the primary skill for all FAN Club development."
metadata:
  author: fan-team
  version: "1.0.0"
---

# FAN Club — Project Context & Architecture

## Project Overview

FAN Club is a **full-stack e-commerce platform** with three applications:

| App | Tech | Port | Deployment |
|-----|------|------|------------|
| **Frontend** (Customer Storefront) | React 19 + Vite 8 + TypeScript | `5173` | Vercel (`fan-frontend-kappa.vercel.app`) |
| **Admin** (Dashboard) | React 19 + Vite 8 + TypeScript | `5174` | Vercel (`fan-admin-six.vercel.app`) |
| **Backend** (REST API) | NestJS 11 + Prisma 7 + TypeScript | `3001` | Cloud Run |

**Database:** PostgreSQL via Supabase (Session Mode Pooler)
**Auth:** Supabase Auth with JWT (Bearer token in Authorization header)
**Payments:** Razorpay (India)
**Storage:** Supabase Storage (product images, avatars)


---

## Project File Structure

```
FAN/
├── frontend/                 # Customer storefront (React + Vite)
│   ├── src/
│   │   ├── App.tsx           # Root component with BrowserRouter + AnimatePresence
│   │   ├── main.tsx          # Entry point
│   │   ├── index.css         # BAUHAUS DESIGN SYSTEM (all CSS variables, typography, buttons, cards)
│   │   ├── App.css           # App-level layout styles
│   │   ├── config.ts         # Runtime configuration
│   │   ├── components/       # Reusable UI components
│   │   │   ├── AnimatedPage.tsx       # Page transition wrapper (Framer Motion)
│   │   │   ├── TopNav/TopNav.tsx      # Desktop navigation
│   │   │   ├── MobileBottomNav/       # Mobile bottom tab bar
│   │   │   ├── Footer/Footer.tsx      # Site footer
│   │   │   ├── FooterVideo/           # Brand video above footer
│   │   │   ├── ProductCard/           # Product listing card
│   │   │   ├── CartDrawer/            # Slide-out cart panel
│   │   │   ├── BrandIntro/            # Initial loading animation (2.8s)
│   │   │   ├── Particles.tsx          # Background particle effect
│   │   │   ├── ProtectedRoute.tsx     # Auth-gated route wrapper
│   │   │   ├── ErrorBoundary.tsx      # React error boundary
│   │   │   ├── SEOHead.tsx            # Dynamic meta tags per page
│   │   │   ├── SocialProofToast.tsx   # Fake "someone just bought" toasts
│   │   │   ├── FloatingSocials/       # Fixed social media links
│   │   │   ├── Magnetic.tsx           # Magnetic cursor effect
│   │   │   ├── Breadcrumbs.tsx        # Page breadcrumbs
│   │   │   └── TopProgressBar.tsx     # Route-change loading bar
│   │   ├── context/
│   │   │   ├── AuthContext.tsx        # Authentication state (login, register, OAuth, token refresh)
│   │   │   └── CartContext.tsx        # Cart state management
│   │   ├── lib/
│   │   │   ├── api.ts                 # Axios instance with auto token refresh interceptor
│   │   │   ├── supabase.ts            # Supabase client initialization
│   │   │   ├── utils.ts              # Utility functions
│   │   │   └── socialIcons.tsx        # Social media SVG icons
│   │   └── pages/
│   │       ├── Home/Home.tsx          # Landing page with hero, featured products
│   │       ├── Shop/Shop.tsx          # Product listing with filters
│   │       ├── ProductDetail/         # Single product page
│   │       ├── Cart/Cart.tsx          # Cart page
│   │       ├── Checkout/             # Checkout + OrderSuccess + PaymentStatus
│   │       ├── Wishlist/             # Saved products
│   │       ├── Profile/             # User profile + order history
│   │       ├── Auth/                # Login, Register, ForgotPassword, ResetPassword
│   │       ├── Cinema/              # Brand media experience
│   │       ├── Contact/             # Contact form
│   │       ├── About/               # About page
│   │       ├── Support/             # FAQ, Privacy, Returns, Terms
│   │       ├── LaunchChecklist/     # Pre-launch verification
│   │       └── NotFound.tsx         # 404 page
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── vercel.json                  # SPA routing rewrites
│
├── admin/                    # Admin dashboard (React + Vite)
│   ├── src/
│   │   ├── App.tsx           # Routes + AdminAuthProvider + Toaster (bottom-right)
│   │   ├── index.css         # Bauhaus design system (shared with frontend)
│   │   ├── context/
│   │   │   └── AdminAuthContext.tsx  # Admin auth (email+password login, not OAuth)
│   │   ├── layouts/
│   │   │   └── AdminLayout.tsx       # Sidebar + content area wrapper
│   │   ├── pages/
│   │   │   ├── AdminLogin.tsx        # Admin login page
│   │   │   ├── Dashboard.tsx         # Sales analytics, KPIs, charts
│   │   │   ├── Products.tsx          # Product list + CRUD actions
│   │   │   ├── ProductForm.tsx       # Create/Edit product form
│   │   │   ├── Categories.tsx        # Category management
│   │   │   ├── Orders.tsx            # Order management + status updates
│   │   │   ├── Payments.tsx          # Payment tracking + refunds
│   │   │   ├── Customers.tsx         # User management
│   │   │   ├── Reviews.tsx           # Review moderation
│   │   │   ├── Newsletter.tsx        # Subscriber management
│   │   │   ├── Contacts.tsx          # Contact form inbox
│   │   │   └── Settings.tsx          # Store configuration
│   │   ├── components/              # Admin-specific components
│   │   └── lib/                     # API client, utils
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── vercel.json
│
├── backend/                  # NestJS REST API
│   ├── src/
│   │   ├── main.ts           # Bootstrap: CORS, ValidationPipe, global prefix '/api'
│   │   ├── app.module.ts     # Root module: imports all feature modules + global providers
│   │   ├── prisma/           # PrismaService (singleton, extends PrismaClient)
│   │   ├── supabase/         # SupabaseService (Auth + Storage client)
│   │   ├── auth/             # JWT auth: guards, decorators, DTOs, signup/signin/OAuth
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts   # Validates Supabase JWT → looks up Prisma user
│   │   │   │   └── admin.guard.ts      # Checks req.user.role === 'ADMIN'
│   │   │   ├── decorators/             # Custom decorators (@CurrentUser, etc.)
│   │   │   └── dto/                    # class-validator DTOs
│   │   ├── users/            # User CRUD + profile
│   │   ├── products/         # Product CRUD with Supabase Storage images
│   │   ├── categories/       # Category management
│   │   ├── cart/             # Shopping cart operations
│   │   ├── orders/           # Order lifecycle management
│   │   ├── payments/         # Razorpay Gateway
│   │   │   ├── payments.controller.ts  # Unified payment endpoints
│   │   │   ├── payments.service.ts     # Payment orchestration logic
│   │   │   ├── razorpay.service.ts     # Razorpay-specific operations

│   │   │   ├── dto/                    # Payment DTOs
│   │   │   └── interfaces/            # Payment type definitions
│   │   ├── reviews/          # Product review CRUD
│   │   ├── wishlist/         # Wishlist management
│   │   ├── upload/           # Supabase Storage file upload
│   │   ├── newsletter/       # Email subscription
│   │   ├── contact/          # Contact form submissions
│   │   ├── dashboard/        # Admin analytics (sales, KPIs)
│   │   ├── settings/         # Store configuration
│   │   ├── health/           # Health check endpoint
│   │   └── common/           # Shared utilities
│   │       ├── filters/http-exception.filter.ts   # Global exception handling
│   │       ├── interceptors/logging.interceptor.ts # Request logging
│   │       └── validators/                         # Custom validators
│   ├── prisma/
│   │   └── schema.prisma     # Database schema (16 models, 6 enums)
│   ├── prisma.config.ts      # Prisma config with direct URL
│   ├── supabase/migrations/  # SQL migration files
│   ├── test/                 # E2E tests
│   ├── scripts/              # Utility scripts
│   ├── nest-cli.json
│   └── tsconfig.json
│
├── .mcp.json                 # MCP server config (Supabase MCP)
├── .github/workflows/        # CI/CD pipelines
└── .agents/skills/           # Antigravity custom skills
```

---

## Database Schema (16 Models, 6 Enums)

```
User ─────── 1:N ──→ Address
 │                       │
 ├── 1:N ──→ CartItem    ├── 1:N ──→ Order ──→ 1:N OrderItem
 ├── 1:N ──→ Order       │                      │
 ├── 1:N ──→ Review      │              Order ──→ 1:N Payment ──→ 1:N Transaction
 └── 1:N ──→ Wishlist    │                                    ──→ 1:N Refund
                         │
Category ── 1:N ──→ Product ──→ 1:N CartItem
                          ──→ 1:N OrderItem
                          ──→ 1:N Review
                          ──→ 1:N Wishlist

Standalone: Newsletter, Contact, WebhookLog
```

### Key Enums
- `Role`: `USER`, `ADMIN`
- `OrderStatus`: `PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED` (also `CANCELLED`, `REFUNDED`)
- `PaymentGateway`: `RAZORPAY`, `COD`
- `PaymentStatus`: `PENDING → PROCESSING → COMPLETED` (also `FAILED`, `REFUNDED`, `PARTIALLY_REFUNDED`, `CANCELLED`)
- `RefundStatus`: `PENDING → PROCESSING → COMPLETED` (also `FAILED`)
- `Gender`: `MEN`, `WOMEN`, `UNISEX`

### Model Naming Conventions
- Prisma model: **PascalCase** (`CartItem`)
- Database table: **snake_case** via `@@map` (`cart_items`)
- IDs: UUID (`@default(uuid())`)
- Timestamps: `createdAt`, `updatedAt` on every model
- User-Auth link: `User.authId` maps to `Supabase Auth user.id`

---

## Backend Architecture Patterns

### Global Configuration (main.ts)
- **Global prefix:** All routes prefixed with `/api` (e.g., `/api/products`)
- **rawBody:** Enabled for webhook signature verification

- **CORS:** Only `FRONTEND_URL` and `ADMIN_URL` + hardcoded Vercel domains
- **ValidationPipe:** `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- **Static assets:** `public/` directory served at `/public`

### Global Providers (app.module.ts)

- `HttpExceptionFilter` — Global exception formatting
- `LoggingInterceptor` — Request logging

### Module Pattern
Every feature follows this structure:
```
feature/
├── feature.module.ts      # @Module with imports, controllers, providers, exports
├── feature.controller.ts  # @Controller('feature') with route handlers
├── feature.service.ts     # @Injectable() business logic
├── dto/                   # Request validation DTOs
│   ├── create-feature.dto.ts
│   └── update-feature.dto.ts
└── interfaces/            # TypeScript interfaces (optional)
```

### Auth Flow
1. **Supabase Auth** handles signup/signin → issues JWT access + refresh tokens
2. **Backend** validates JWT via `supabase.auth.getUser(token)` in `JwtAuthGuard`
3. **JwtAuthGuard** looks up user in Prisma by `authId`, attaches `req.user`
4. **AdminGuard** checks `req.user.role === 'ADMIN'` (always used AFTER JwtAuthGuard)
5. **Frontend** stores tokens in `localStorage`, sends via `Authorization: Bearer <token>`
6. **Token refresh:** Axios interceptor catches 401 → calls `/api/auth/refresh` → retries

### Protecting Routes
```typescript
// User-only endpoint
@UseGuards(JwtAuthGuard)
@Get('profile')

// Admin-only endpoint (JwtAuthGuard MUST come first)
@UseGuards(JwtAuthGuard, AdminGuard)
@Post('products')
```

---

## Frontend Architecture Patterns

### Design System: "Bauhaus Constructivist"
- **All CSS variables defined in `index.css`** — no Tailwind
- **Colors:** `--bauhaus-red`, `--bauhaus-blue`, `--bauhaus-yellow`, `--bauhaus-black`, `--bauhaus-white`
- **Typography (5 fonts):**
  - `--font-display` (Space Grotesk) → Headlines, titles
  - `--font-body` (Inter) → Body text
  - `--font-accent` (Oufant) → Buttons, nav, labels
  - `--font-mono` (JetBrains Mono) → Prices, order numbers
  - `--font-editorial` (Playfair Display) → Quotes, testimonials
- **Borders:** Thick, black, deliberate (2-3px solid #121212)
- **Shadows:** Hard offset, no blur (`6px 6px 0px 0px #121212`)
- **Radius:** Binary — either 0px (square) or 9999px (circle)
- **Animations:** Mechanical, snappy (0.15s–0.3s ease-out)

### CSS Classes Available
- **Typography:** `.heading-xl`, `.heading-lg`, `.heading-md`, `.heading-sm`, `.text-gradient`, `.text-muted`, `.font-display`, `.font-body`, `.font-accent`, `.font-mono`, `.font-editorial`, `.editorial-quote`, `.price-display`, `.data-label`
- **Buttons:** `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-ghost`, `.btn-lg`, `.btn-sm`, `.btn-icon`
- **Cards:** `.glass-card`
- **Inputs:** `.input-field`, `.input-label`
- **Badges:** `.badge`, `.badge-primary`, `.badge-success`, `.badge-warning`, `.badge-danger`
- **Layout:** `.section`, `.section-header`, `.container`, `.product-grid`, `.contact-grid`, `.standard-page-padding`
- **Animations:** `.animate-fade-in-up`, `.animate-fade-in`, `.animate-cinematic`, `.skeleton`

### Page Component Pattern
```tsx
import AnimatedPage from '../../components/AnimatedPage';

export default function FeaturePage() {
  return (
    <AnimatedPage className="feature-page">
      <div className="container">
        {/* Page content */}
      </div>
    </AnimatedPage>
  );
}
```

### Framer Motion Presets (from AnimatedPage.tsx)
- **Page enter:** `opacity: 0 → 1, y: 56 → 0, scale: 0.985 → 1, blur: 8px → 0px` (0.85s)
- **Page exit:** `opacity: 1 → 0, y: 0 → -28, scale: 1 → 0.992, blur: 0 → 6px` (0.45s)
- **Stagger children:** `staggerChildren: 0.08, delayChildren: 0.04`
- **Cinematic ease:** `[0.22, 1, 0.36, 1]`

### API Client (lib/api.ts)
- Axios instance with `baseURL = VITE_API_URL` (auto-appends `/api`)
- `withCredentials: true` for cookie-based auth
- Request interceptor adds `Authorization: Bearer <token>` from localStorage
- Response interceptor handles 401 → auto-refresh → retry queue

### Auth Context Pattern
- `AuthProvider` wraps entire app
- Provides: `user`, `loading`, `login()`, `register()`, `logout()`, `updateUser()`, `socialLogin()`
- OAuth: Supabase `signInWithOAuth` → redirect → `onAuthStateChange` → `/auth/user/oauth/sync`
- Session persistence: `localStorage` for user + tokens

### Cart Context Pattern
- `CartProvider` wraps entire app (inside AuthProvider)
- Syncs with backend `/api/cart` endpoints when user is logged in
- Local state for guest carts

### Route Protection
```tsx
<ProtectedRoute>
  <PageComponent />
</ProtectedRoute>
```
Redirects to `/login` if not authenticated.

---

## Environment Variables

### Backend (.env)
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase PostgreSQL connection (Session Mode Pooler) |
| `DIRECT_URL` | Direct Supabase DB connection (for migrations) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side service role key |
| `SUPABASE_JWT_SECRET` | JWT verification secret |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature verification |

| `ADMIN_EMAIL` | Default admin email (seeder) |
| `ADMIN_PASSWORD` | Default admin password (seeder) |
| `PORT` | Server port (default: 3001) |
| `FRONTEND_URL` | CORS origin for storefront |
| `ADMIN_URL` | CORS origin for admin dashboard |

### Frontend/Admin (.env)
| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Backend API URL (e.g., `http://localhost:3001/api`) |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |

---

## Business Rules

### Order Lifecycle
`PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED`
- Orders can be `CANCELLED` from any state before `SHIPPED`
- Orders can be `REFUNDED` only after `DELIVERED`

### Payment Flow
1. Customer selects payment gateway (Razorpay for online payments)
2. Backend creates a gateway-specific order/session
3. Frontend handles gateway checkout UI
4. Gateway webhook confirms payment → backend updates Payment + Order status
5. Idempotency keys prevent duplicate charges

### Dual Gateway Architecture
- `PaymentGateway` enum routes to `RazorpayService`
- Both services implement the same interface pattern
- `WebhookLog` model records all webhook events for debugging
- `Transaction` model tracks individual charge/refund/settlement events

---

## Critical Development Rules

1. **Always use `@UseGuards(JwtAuthGuard)` before `AdminGuard`** — AdminGuard depends on `req.user` set by JwtAuthGuard
2. **All API routes are prefixed with `/api`** — set in main.ts via `app.setGlobalPrefix('api')`
3. **Use `class-validator` decorators on DTOs** — ValidationPipe enforces them globally
4. **Never import from `@prisma/client` directly in services** — inject `PrismaService` instead
5. **Use Supabase Storage signed URLs** for file uploads — never store files locally
6. **CSS design system is in `index.css`** — use the CSS variables, don't hardcode colors
7. **Every page must be wrapped in `<AnimatedPage>`** for consistent page transitions
8. **Use `api.ts` Axios instance** for all API calls — it handles auth token injection and refresh
9. **Use `@CurrentUser()` decorator** instead of `@Req() req` for accessing authenticated user
10. **Use `.js` extension** in `app.module.ts` imports for ESM compatibility


---

## Admin Dashboard

### Admin Auth
- Uses `AdminAuthContext` (separate from frontend `AuthContext`)
- `useAdminAuth()` returns: `{ admin, loading, login, logout }`
- Admin login is email+password only (no OAuth)
- Protected via `ProtectedRoutes` wrapper that checks `admin` object

### Admin Routes
| Path | Page | Purpose |
|------|------|---------|
| `/login` | AdminLogin | Email + password authentication |
| `/` | Dashboard | Sales analytics, KPIs, revenue charts |
| `/products` | Products | Product list, create/edit/delete |
| `/products/new` | ProductForm | Create new product |
| `/products/:id/edit` | ProductForm | Edit existing product |
| `/categories` | Categories | Category CRUD |
| `/orders` | Orders | Order management, status updates |
| `/payments` | Payments | Payment tracking, initiate refunds |
| `/customers` | Customers | User list, role management |
| `/reviews` | Reviews | Review moderation |
| `/newsletter` | Newsletter | Subscriber management |
| `/contacts` | Contacts | Contact form inbox |
| `/settings` | Settings | Store configuration |

### Admin Toaster
Positioned `bottom-right` (vs `top-center` in frontend), same Bauhaus styling.
