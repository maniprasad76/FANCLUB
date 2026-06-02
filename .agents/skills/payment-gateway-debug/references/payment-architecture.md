# Payment Gateway Interface Reference

> Extracted from `backend/src/payments/interfaces/payment-gateway.interface.ts`

Both `RazorpayService` and `StripeService` implement this interface, enabling gateway-agnostic orchestration in `PaymentsService`.

## Interface Definition

```typescript
export interface PaymentGatewayProvider {
  createOrder(amount: number, currency: string, metadata: Record<string, any>): Promise<GatewayOrder>;
  verifyPayment(data: Record<string, any>): Promise<VerificationResult>;
  processRefund(gatewayPaymentId: string, amount: number): Promise<RefundResult>;
  getPaymentDetails(gatewayPaymentId: string): Promise<PaymentDetails>;
}
```

## Data Types

```typescript
interface GatewayOrder {
  gatewayOrderId: string;   // razorpay_order_id or stripe_session_id
  amount: number;
  currency: string;
  status: string;
  metadata?: Record<string, any>;
}

interface VerificationResult {
  verified: boolean;
  gatewayPaymentId: string;
  gatewayOrderId: string;
  method?: string;          // upi, card, netbanking, etc.
  metadata?: Record<string, any>;
}

interface RefundResult {
  gatewayRefundId: string;
  amount: number;
  status: string;           // 'processed' (Razorpay) or 'succeeded' (Stripe)
}

interface PaymentDetails {
  gatewayPaymentId: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  metadata?: Record<string, any>;
}
```

## Gateway Routing Logic (from PaymentsService)

```typescript
private resolveGateway(country?: string, explicitGateway?: string): 'RAZORPAY' | 'STRIPE' {
  if (explicitGateway) {
    const g = explicitGateway.toUpperCase();
    if (g === 'RAZORPAY' || g === 'STRIPE') return g;
  }
  const c = (country || 'India').toLowerCase().trim();
  if (c === 'india' || c === 'in' || c === 'ind') return 'RAZORPAY';
  return 'STRIPE';
}
```

## Payment DTOs (from `dto/payment.dto.ts`)

```typescript
class CreatePaymentDto {
  @IsString() orderId: string;
  @IsOptional() @IsString() gateway?: string;   // RAZORPAY, STRIPE, COD
  @IsOptional() @IsString() country?: string;    // Auto-routes gateway
  @IsOptional() @IsString() currency?: string;   // Default: INR
}

class VerifyRazorpayDto {
  @IsString() razorpayOrderId: string;
  @IsString() razorpayPaymentId: string;
  @IsString() signature: string;
}

class RefundDto {
  @IsOptional() @IsNumber() @Min(1) amount?: number;  // Partial refund
  @IsOptional() @IsString() reason?: string;
}

class RetryPaymentDto {
  @IsOptional() @IsString() gateway?: string;
}
```

## API Endpoints (from `payments.controller.ts`)

### Customer Endpoints (require JwtAuthGuard)
| Method | Path | DTO | Purpose |
|--------|------|-----|---------|
| POST | `/api/payments/create-order` | `CreatePaymentDto` | Create payment order |
| POST | `/api/payments/verify` | `VerifyRazorpayDto` | Verify Razorpay callback |
| GET | `/api/payments/stripe/verify?session_id=xxx` | — | Verify Stripe redirect |
| POST | `/api/payments/retry/:orderId` | `RetryPaymentDto` | Retry failed payment |
| GET | `/api/payments/:paymentId/status` | — | Get payment status |
| GET | `/api/payments/order/:orderId` | — | Get all payments for order |

### Webhook Endpoints (no auth, @SkipThrottle)
| Method | Path | Signature Header | Purpose |
|--------|------|-----------------|---------|
| POST | `/api/payments/webhook/razorpay` | `x-razorpay-signature` | Razorpay webhook |
| POST | `/api/payments/webhook/stripe` | `stripe-signature` | Stripe webhook |

### Admin Endpoints (require JwtAuthGuard + AdminGuard)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/payments/refund/:paymentId` | Initiate refund |
| GET | `/api/payments/admin/stats` | Payment analytics |
| GET | `/api/payments/admin/list?page=1&limit=20&status=&gateway=` | Paginated list |

## Stub Mode

Both `RazorpayService` and `StripeService` support **stub mode** — if API keys are not configured or start with placeholder values (`your-`, `sk_test_your_`), they return fake responses. This allows local development without real gateway credentials.

### How stub mode is detected:
- **Razorpay:** `keyId` empty or starts with `your-` → stub mode
- **Stripe:** `secretKey` empty or starts with `sk_test_your_` → stub mode

### Stub responses:
- `createOrder` returns `order_stub_<timestamp>` / `cs_stub_<timestamp>`
- `verifyPayment` returns `{ verified: true }` (always passes)
- `processRefund` returns `refund_stub_<timestamp>`

## Currency Conversion Rules

| Gateway | Input Unit | Storage Unit | Conversion |
|---------|-----------|-------------|------------|
| **Razorpay** | Rupees (₹) | Paise | `Math.round(amount * 100)` in `createOrder`, `/100` on response |
| **Stripe** | Base currency | Smallest unit (cents/paise) | `Math.round(amount * 100)` in `createOrder`, `/100` on response |

> **CRITICAL:** Both services handle conversion internally. `PaymentsService` always works with base currency (₹ / $). Never pass pre-converted amounts to `createOrder`.

## Refund Flow Detail

```
processRefund(paymentId, amount?, reason?)
  ├── Validate: payment exists, status === 'COMPLETED', gatewayPaymentId exists
  ├── Calculate: alreadyRefunded = sum of COMPLETED/PROCESSING refunds
  ├── Determine: refundAmount = amount || (payment.amount - alreadyRefunded)
  ├── Guard: refundAmount > 0 && refundAmount <= (payment.amount - alreadyRefunded)
  ├── Gateway: razorpayService.processRefund() or stripeService.processRefund()
  ├── DB: Create Refund record with gatewayRefundId
  ├── DB: Create Transaction record (type: 'REFUND')
  ├── DB: Update Payment → REFUNDED (full) or PARTIALLY_REFUNDED (partial)
  └── DB: Update Order → REFUNDED (if fully refunded)
```
