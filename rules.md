# FAN Club Project Rules

## 1. Project Overview
FAN Club is a full-stack e-commerce platform consisting of three applications:
- **Frontend** (Customer Storefront): React 19 + Vite 8 + TypeScript (Port 5173)
- **Admin** (Dashboard): React 19 + Vite 8 + TypeScript (Port 5174)
- **Backend** (REST API): NestJS 11 + Prisma 7 + TypeScript (Port 3001)

**Key Services:**
- Database: PostgreSQL via Supabase
- Auth: Supabase Auth with JWT
- Payments: Razorpay (India) + Stripe (International)
- Storage: Supabase Storage
- Emails: Nodemailer
- SMS: Twilio

## 2. Directory Structure
- `/frontend`: Customer storefront SPA.
- `/admin`: Admin dashboard SPA.
- `/backend`: NestJS REST API.
- `/.agents/skills`: Contains agent context and skills.

## 3. Backend Architecture Rules (NestJS)
- **Global Prefix:** All API routes must be prefixed with `/api`.
- **Validation:** Always use `class-validator` decorators on DTOs. `ValidationPipe` enforces them globally.
- **Database Access:** Never import from `@prisma/client` directly in services. Inject `PrismaService` instead.
- **Authentication:** Use `@UseGuards(JwtAuthGuard)` to protect routes.
  - **Admin Routes:** Always use `@UseGuards(JwtAuthGuard)` BEFORE `AdminGuard` (since AdminGuard depends on `req.user` set by JwtAuthGuard).
  - Use the `@CurrentUser()` decorator to access the authenticated user, not `@Req() req`.
- **Rate Limiting:** Webhook endpoints must bypass rate limiting using `@SkipThrottle()`.
- **Imports:** Use `.js` extension in `app.module.ts` imports for ESM compatibility if applicable.
- **File Uploads:** Use Supabase Storage signed URLs. Do not store files locally.

## 4. Frontend Architecture Rules (React)
- **Design System ("Bauhaus Constructivist"):**
  - **NO Tailwind CSS.** All styling uses vanilla CSS.
  - CSS variables are defined globally in `index.css`. Never hardcode colors.
  - Borders are thick, black, and deliberate. Shadows have hard offset with no blur.
- **Animations:**
  - Every page component must be wrapped in `<AnimatedPage>` for consistent transitions (Framer Motion).
- **API Calls:**
  - Always use the `api.ts` Axios instance for API calls. It handles auth token injection and refresh.
- **Routing:**
  - Protected routes must use the `<ProtectedRoute>` wrapper.
- **State Management:**
  - Uses `AuthContext` for user state and `CartContext` for cart state.
  - Admin dashboard uses a separate `AdminAuthContext` (email/password only, no OAuth).

## 5. Database Schema Conventions (Prisma)
- **Prisma Models:** Use **PascalCase** (e.g., `CartItem`).
- **Database Tables:** Map to **snake_case** using `@@map` (e.g., `@@map("cart_items")`).
- **IDs:** Use UUIDs (`@default(uuid())`).
- **Timestamps:** Every model must have `createdAt` and `updatedAt`.
- **Auth Linking:** `User.authId` maps to the Supabase Auth `user.id`.

## 6. Business Logic Rules
- **Order Lifecycle:** `PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`.
  - Cancellations can occur from any state before `SHIPPED`.
  - Refunds can only occur after `DELIVERED`.
- **Payments:** Dual Gateway Architecture (Razorpay + Stripe). Both implement the same interface pattern.

## 7. Critical Reminders
- Prioritize visual excellence in the frontend, adhering strictly to the Bauhaus aesthetic.
- Ensure environment variables are properly typed and configured.
- Adhere strictly to the dual payment gateway approach, updating `Transaction` and `WebhookLog` models accordingly.
