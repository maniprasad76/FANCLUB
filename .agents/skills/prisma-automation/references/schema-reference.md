# Complete Prisma Schema Reference

> Exact copy of `backend/prisma/schema.prisma` — 16 models, 6 enums, 342 lines

## Enums

| Enum | Values |
|------|--------|
| `Role` | `USER`, `ADMIN` |
| `OrderStatus` | `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED` |
| `Gender` | `MEN`, `WOMEN`, `UNISEX` |
| `PaymentStatus` | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `REFUNDED`, `PARTIALLY_REFUNDED`, `CANCELLED` |
| `PaymentGateway` | `RAZORPAY`, `COD` |
| `RefundStatus` | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` |

## Models Summary

| Model | Table Name | Key Fields | Relations |
|-------|-----------|------------|-----------|
| `User` | `users` | email, name, phone, avatar, role, **authId** (unique, Supabase link) | → Address[], CartItem[], Order[], Review[], Wishlist[] |
| `Address` | `addresses` | name, phone, street, city, state, pincode, country, isDefault | → User, → Order[] |
| `Category` | `categories` | name (unique), slug (unique), description, image | → Product[] |
| `Product` | `products` | name, slug (unique), description, price, comparePrice, images[], sizes[], colors[], stock, featured, bestseller, newArrival, rating, reviewCount, tags[], gender, isActive | → Category, → CartItem[], OrderItem[], Review[], Wishlist[] |
| `CartItem` | `cart_items` | quantity, size, color | → User, → Product. Unique: [userId, productId, size, color] |
| `Order` | `orders` | orderNumber (unique), totalAmount, shippingAmount, discountAmount, paymentMethod, paymentId, razorpayOrderId, status, trackingId, notes | → User, → Address?, → OrderItem[], Payment[] |
| `OrderItem` | `order_items` | quantity, size, color, price, name, image | → Order (cascade), → Product |
| `Payment` | `payments` | gateway, gatewayPaymentId, gatewayOrderId, amount, currency, status, method, **idempotencyKey** (unique), metadata (Json), paidAt | → Order, → Transaction[], Refund[] |
| `Transaction` | `transactions` | type (CHARGE/REFUND/SETTLEMENT), amount, currency, status, gatewayRef | → Payment |
| `Refund` | `refunds` | amount, reason, status, gatewayRefundId, processedAt | → Payment |
| `WebhookLog` | `webhook_logs` | gateway, eventType, payload (Json), signature, processed, error | — (standalone) |
| `Review` | `reviews` | rating (Int), comment | → User (cascade), → Product (cascade). Unique: [userId, productId] |
| `Wishlist` | `wishlists` | — | → User (cascade), → Product (cascade). Unique: [userId, productId] |
| `Newsletter` | `newsletters` | email (unique) | — |
| `Contact` | `contacts` | name, email, subject, message, isRead | — |

## Index Catalog

| Model | Indexes |
|-------|---------|
| `User` | `[role]` |
| `Address` | `[userId]` |
| `Product` | `[categoryId]`, `[featured]`, `[bestseller]`, `[newArrival]`, `[isActive]`, `[gender]`, `[featured, isActive]`, `[createdAt]` |
| `CartItem` | `[userId]`, `[productId]` + unique `[userId, productId, size, color]` |
| `Order` | `[userId]`, `[status]`, `[createdAt]` |
| `OrderItem` | `[orderId]`, `[productId]` |
| `Payment` | `[orderId]`, `[gatewayPaymentId]`, `[gatewayOrderId]`, `[status]` |
| `Transaction` | `[paymentId]` |
| `Refund` | `[paymentId]` |
| `WebhookLog` | `[gateway, eventType]`, `[createdAt]` |
| `Review` | `[productId]` + unique `[userId, productId]` |
| `Wishlist` | `[userId]`, `[productId]` + unique `[userId, productId]` |

## Cascade Delete Rules

| Parent | Child | On Delete |
|--------|-------|-----------|
| User | Address | Cascade |
| User | CartItem | Cascade |
| User | Review | Cascade |
| User | Wishlist | Cascade |
| Product | CartItem | Cascade |
| Product | Review | Cascade |
| Product | Wishlist | Cascade |
| Order | OrderItem | Cascade |
| User → Order | — | No cascade (orders preserved) |
| Product → OrderItem | — | No cascade (order history preserved) |

## Relationship Diagram

```
User ─────┬──→ Address[]
          ├──→ CartItem[] ←── Product
          ├──→ Order[] ──→ OrderItem[] ←── Product
          │          └──→ Payment[] ──→ Transaction[]
          │                    └──→ Refund[]
          ├──→ Review[] ←── Product
          └──→ Wishlist[] ←── Product

Category ──→ Product[]

WebhookLog (standalone)
Newsletter (standalone)
Contact (standalone)
```
