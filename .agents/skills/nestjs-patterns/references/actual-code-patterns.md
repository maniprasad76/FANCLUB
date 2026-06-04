# NestJS Reference — Actual Code Patterns

> Extracted from the FAN Club backend source code.

## Custom Decorators

### @CurrentUser Decorator (`auth/decorators/current-user.decorator.ts`)

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (data) {
      return request.user?.[data];
    }
    return request.user;
  },
);
```

**Usage in controllers:**
```typescript
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// Get the full user object
@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user: { id: string; email: string; name: string; role: string; authId: string }) {
  return this.service.getProfile(user.id);
}

// Get a specific field
@Get('my-orders')
@UseGuards(JwtAuthGuard)
getMyOrders(@CurrentUser('id') userId: string) {
  return this.ordersService.findByUser(userId);
}
```

---

## Global Exception Filter (`common/filters/http-exception.filter.ts`)

Catches ALL exceptions and formats them. In production, hides internal error details.

### Response Format
```json
{
  "statusCode": 400,
  "message": "Invalid quantity",
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/products/123"
}

// Development only — also includes:
{
  "stack": "Error: ...\n    at ..."
}
```

### Logging behavior
- **4xx errors** → `Logger.warn()` level
- **5xx errors** → `Logger.error()` level with stack trace
- **Unknown errors** → `Logger.error()`, message hidden in production

---

## Global Logging Interceptor (`common/interceptors/logging.interceptor.ts`)

Logs all incoming requests with method, URL, and response time.

---

## Admin Dashboard (Separate App)

The admin app at `admin/` uses `AdminAuthContext` (not `AuthContext`):

```typescript
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';

// useAdminAuth() returns: { admin, loading, login, logout }
```

### Admin Routes
| Path | Page | Purpose |
|------|------|---------|
| `/login` | AdminLogin | Admin authentication |
| `/` | Dashboard | Sales analytics, KPIs |
| `/products` | Products | Product list with CRUD |
| `/products/new` | ProductForm | Create product |
| `/products/:id/edit` | ProductForm | Edit product |
| `/categories` | Categories | Category management |
| `/orders` | Orders | Order management |
| `/payments` | Payments | Payment tracking |
| `/customers` | Customers | User management |
| `/reviews` | Reviews | Review moderation |
| `/newsletter` | Newsletter | Subscriber management |
| `/contacts` | Contacts | Contact form inbox |
| `/settings` | Settings | Store configuration |

### Admin Layout Pattern
- Uses `AdminLayout` wrapper (sidebar + content area)
- Protected via `ProtectedRoutes` component that checks `admin` from `useAdminAuth()`
- Toast position: `bottom-right` (vs `top-center` in frontend)

---

## Module Registration Convention

When adding a new module to `app.module.ts`, use `.js` extension in import paths:

```typescript
// ✅ Correct — use .js extension for ESM compatibility
import { FeatureModule } from './feature/feature.module.js';

// ❌ Wrong — will cause import resolution issues
import { FeatureModule } from './feature/feature.module';
```

---

## Webhook Security Patterns

### Skipping Throttle on Webhooks
```typescript
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()  // Webhooks shouldn't be rate-limited
@Post('webhook/razorpay')
async webhookRazorpay(@Req() req: any, @Headers('x-razorpay-signature') signature: string, @Body() body: any) {
  const rawBody = req.rawBody?.toString() || JSON.stringify(body);
  return this.paymentsService.handleRazorpayWebhook(rawBody, signature, body);
}
```

### Key Points
1. `@SkipThrottle()` — webhooks must bypass rate limiting
2. `req.rawBody?.toString()` — use raw body for signature verification
3. Fallback to `JSON.stringify(body)` if rawBody unavailable
4. Stripe uses `Buffer`: `req.rawBody || Buffer.from(JSON.stringify(req.body))`
