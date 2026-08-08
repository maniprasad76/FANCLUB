import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { ConfigService } from '@nestjs/config';
import { CouponsService } from '../coupons/coupons.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  PaymentMethodEnum,
  OrderStatusEnum,
} from './dto/orders.dto';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { OrderNotificationHelper } from '../common/services/order-notification.helper';
import { SettingsService } from '../settings/settings.service';

/** Shipping threshold & cost — single source of truth */
const FREE_SHIPPING_THRESHOLD = 0;
const SHIPPING_COST = 0;

/**
 * Allowed order status transitions.
 * Key = current status, value = set of statuses admin can move to.
 * REFUNDED is set only via the payment/refund flow, not directly by admin.
 */
const VALID_TRANSITIONS: Record<string, OrderStatusEnum[]> = {
  PENDING: [OrderStatusEnum.CONFIRMED, OrderStatusEnum.CANCELLED],
  CONFIRMED: [OrderStatusEnum.PROCESSING, OrderStatusEnum.CANCELLED],
  PROCESSING: [OrderStatusEnum.SHIPPED, OrderStatusEnum.CANCELLED],
  SHIPPED: [OrderStatusEnum.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

@Injectable()
export class OrdersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrdersService.name);

  /** Default time a PENDING online order stays open before it expires. */
  private readonly defaultTtlMinutes = 15;
  /** How often the stale-order scan runs (base interval). */
  private readonly scanIntervalMs = 60_000;
  /** Backoff interval after repeated failures (5 minutes). */
  private readonly backoffIntervalMs = 300_000;
  private expiryTimer?: NodeJS.Timeout;
  /** Track consecutive scan failures for backoff logic. */
  private consecutiveScanFailures = 0;

  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
    private config: ConfigService,
    private couponsService: CouponsService,
    private orderNotification: OrderNotificationHelper,
    private loyaltyService: LoyaltyService,
    private settingsService: SettingsService,
  ) {}

  onModuleInit() {
    // ── CRIT 1: Stale PENDING order expiry job ──
    // Self-scheduling scan that releases stock and closes gateway sessions for
    // online orders that were never paid. Guards against overlapping runs.
    this.scheduleScan(this.scanIntervalMs);
    // Run once shortly after boot to clear anything left over from downtime.
    const firstRun = setTimeout(() => void this.runExpiryScan(), 10_000);
    firstRun.unref?.();
  }

  onModuleDestroy() {
    if (this.expiryTimer) clearInterval(this.expiryTimer);
  }

  /**
   * Schedules the next expiry scan. Uses backoff interval after 3+ consecutive
   * failures to avoid flooding logs when the database is temporarily unreachable.
   */
  private scheduleScan(intervalMs: number) {
    if (this.expiryTimer) clearInterval(this.expiryTimer);
    this.expiryTimer = setInterval(() => {
      void this.runExpiryScan();
    }, intervalMs);
    this.expiryTimer.unref?.();
  }

  /** TTL in ms for how long a PENDING online order stays open for payment. */
  private ttlMs(): number {
    const mins = Number(
      this.config.get('ORDER_PAYMENT_TTL_MINUTES', this.defaultTtlMinutes),
    );
    return (
      (Number.isFinite(mins) && mins > 0 ? mins : this.defaultTtlMinutes) *
      60_000
    );
  }

  /**
   * Safe wrapper around expireStaleOrders() — a transient DB failure must
   * never become an unhandled promise rejection that crashes the process.
   * Implements backoff: after 3 consecutive failures, extends scan interval.
   */
  private async runExpiryScan(): Promise<void> {
    try {
      await this.expireStaleOrders();
      // Reset backoff on success
      if (this.consecutiveScanFailures > 0) {
        this.consecutiveScanFailures = 0;
        this.scheduleScan(this.scanIntervalMs);
        this.logger.log('Stale-order expiry scan recovered — resuming normal interval.');
      }
    } catch (err: any) {
      this.consecutiveScanFailures++;
      this.logger.error(
        `Stale-order expiry scan failed (attempt ${this.consecutiveScanFailures}): ${err?.message || err}`,
      );
      // After 3 consecutive failures, back off to reduce log spam
      if (this.consecutiveScanFailures === 3) {
        this.logger.warn(
          `Stale-order expiry scan failed 3 times — backing off to ${this.backoffIntervalMs / 1000}s interval.`,
        );
        this.scheduleScan(this.backoffIntervalMs);
      }
    }
  }

  /**
   * CRIT 1 — Find and expire stale PENDING online orders.
   * Restores stock, cancels pending payments, and closes the Razorpay session.
   */
  async expireStaleOrders(): Promise<number> {
    const now = new Date();
    const legacyCutoff = new Date(now.getTime() - this.ttlMs());

    const candidates = await this.prisma.order.findMany({
      where: {
        status: 'PENDING',
        paymentMethod: 'ONLINE',
        OR: [
          { expiresAt: { lte: now } },
          { expiresAt: null, createdAt: { lte: legacyCutoff } },
        ],
      },
      include: { items: true },
      take: 100,
    });

    let expiredCount = 0;
    for (const order of candidates) {
      try {
        const expired = await this.prisma.$transaction(
          async (tx) => {
            // Never expire an order that already has a confirmed/processing payment
            const livePayment = await tx.payment.findFirst({
              where: {
                orderId: order.id,
                status: { in: ['COMPLETED', 'PROCESSING'] },
              },
            });
            if (livePayment) return false;

            // Guarded update — only flips status if still PENDING + expired
            const updated = await tx.order.updateMany({
              where: {
                id: order.id,
                status: 'PENDING',
                expiresAt: { lte: now },
              },
              data: { status: 'CANCELLED' },
            });
            if (updated.count === 0) return false;

            // Restore stock
            for (const item of order.items) {
              if (!item.productId) continue;
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
              });
            }
            // Cancel pending payment intents so they can never complete
            await tx.payment.updateMany({
              where: { orderId: order.id, status: 'PENDING' },
              data: { status: 'CANCELLED' },
            });
            return true;
          },
          { isolationLevel: 'Serializable' },
        );

        if (expired) {
          expiredCount++;
          this.logger.log(
            `⏰ Expired stale PENDING order ${order.orderNumber} (${order.id})`,
          );
          if (order.razorpayOrderId) {
            await this.paymentsService.closeGatewayOrder(order.razorpayOrderId);
          }
        }
      } catch (err: any) {
        this.logger.error(`Failed to expire order ${order.id}: ${err.message}`);
      }
    }
    return expiredCount;
  }

  /**
   * Creates an order with ZERO-TRUST pricing.
   * All prices are fetched from the database — nothing from the client is trusted.
   *
   * Security hardening:
   * 1. paymentMethod is a strict enum (COD | ONLINE) — validated by DTO
   * 2. COD is gated by the DB `cod_enabled` setting (admin-controlled),
   *    with the COD_ENABLED env var as a deployment-level fallback
   * 3. Duplicate productId lines are merged before stock checks
   * 4. Stock decremented with conditional WHERE stock >= qty (atomic)
   * 5. Gateway session created BEFORE clearing cart/stock to prevent orphaned state
   */
  async create(authId: string, dto: CreateOrderDto, idempotencyKey?: string) {
    const user = await this.prisma.user.findUnique({ where: { authId } });
    if (!user) throw new NotFoundException('User not found');

    // ── MED 14: Idempotent replay — if this key already created an order,
    // return the existing order (or its live payment session) instead of
    // double-charging stock/coupon. ──
    if (idempotencyKey) {
      const existing = await this.prisma.order.findUnique({
        where: { idempotencyKey },
      });
      if (existing && existing.userId === user.id) {
        if (
          existing.paymentMethod === 'ONLINE' &&
          existing.status === 'PENDING'
        ) {
          const address = existing.addressId
            ? await this.prisma.address.findUnique({
                where: { id: existing.addressId },
              })
            : null;
          const country = address?.country || 'India';
          const payload = await this.paymentsService.createPaymentOrder(
            existing.id,
            'RAZORPAY',
            country,
            'INR',
          );
          return { ...existing, ...payload, payment: payload };
        }
        return existing;
      }
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // ── COD availability gate ──
    const paymentMethod = dto.paymentMethod ?? PaymentMethodEnum.COD;
    if (paymentMethod === PaymentMethodEnum.COD && !(await this.isCodEnabled())) {
      throw new BadRequestException(
        'Cash on Delivery is not available for this store.',
      );
    }

    // ── Merge duplicate productId lines (same product+size+color) ──
    const mergedItems = this.mergeOrderItems(dto.items);

    // ── Fetch all products from DB to get trusted prices ──
    const productIds = mergedItems.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missing = productIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(
        `Product(s) not found or inactive: ${missing.join(', ')}`,
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // ── Pre-validate stock (fast path, before transaction) ──
    for (const item of mergedItems) {
      const product = productMap.get(item.productId)!;
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`,
        );
      }
    }

    // ── Server-side price calculation ──
    const subtotal = mergedItems.reduce((sum, item) => {
      const product = productMap.get(item.productId)!;
      return sum + Number(product.price) * item.quantity;
    }, 0);

    let discountAmount = 0;
    if (dto.couponCode) {
      const couponValidation = await this.couponsService.validateCoupon(
        dto.couponCode,
        subtotal,
      );
      if (!couponValidation.valid) {
        throw new BadRequestException(couponValidation.message);
      }
      discountAmount = couponValidation.discountAmount || 0;
    }

    const shippingAmount =
      subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const totalAmount = subtotal - discountAmount + shippingAmount;

    const orderNumber = `FAN-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`;

    // ── Resolve the customer's country from their address ──
    let customerCountry = dto.country || 'India';
    if (dto.addressId) {
      const address = await this.prisma.address.findFirst({
        where: { id: dto.addressId, userId: user.id },
      });
      if (!address) throw new BadRequestException('Invalid shipping address');
      customerCountry = address.country || 'India';
    }

    // ── For ONLINE payments: create gateway session FIRST ──
    // This prevents leaving stock decremented if the gateway API is down.
    let gatewayResult: any = null;

    if (paymentMethod === PaymentMethodEnum.ONLINE) {
      // Create a temporary order record in PENDING state with NO stock changes yet
      let tempOrder;
      try {
        tempOrder = await this.prisma.order.create({
          data: {
            orderNumber,
            idempotencyKey: idempotencyKey || null,
            userId: user.id,
            totalAmount,
            shippingAmount,
            discountAmount,
            couponCode: dto.couponCode
              ? dto.couponCode.toUpperCase().trim()
              : null,
            addressId: dto.addressId,
            paymentMethod: 'ONLINE',
            status: 'PENDING',
            notes: dto.notes,
            expiresAt: new Date(Date.now() + this.ttlMs()),
            items: {
              create: mergedItems.map((item) => {
                const product = productMap.get(item.productId)!;
                return {
                  productId: item.productId,
                  quantity: item.quantity,
                  size: item.size,
                  color: item.color,
                  price: product.price,
                  name: product.name,
                  image: product.images?.[0],
                };
              }),
            },
          },
          include: { items: { include: { product: true } }, address: true },
        });
      } catch (err: any) {
        // Concurrent request won the race with the same idempotency key —
        // return the existing order instead of failing.
        if (err?.code === 'P2002' && idempotencyKey) {
          const existing = await this.prisma.order.findUnique({
            where: { idempotencyKey },
          });
          if (existing) return existing;
        }
        throw err;
      }

      // Create gateway session — if this throws, the temp order remains PENDING
      // and stock has NOT been decremented yet.
      try {
        gatewayResult = await this.paymentsService.createPaymentOrder(
          tempOrder.id,
          dto.gateway,
          customerCountry,
          dto.currency || 'INR',
        );
      } catch (err) {
        // Clean up the temp order so the user can retry cleanly
        await this.prisma.order.delete({ where: { id: tempOrder.id } });
        throw err;
      }

      // Gateway session created successfully — now decrement stock and clear cart atomically
      await this.prisma.$transaction(
        async (tx) => {
          // Atomic conditional stock decrement — prevents oversell under concurrency
          for (const item of mergedItems) {
            const updated = await tx.product.updateMany({
              where: {
                id: item.productId,
                stock: { gte: item.quantity },
              },
              data: { stock: { decrement: item.quantity } },
            });
            if (updated.count === 0) {
              const product = productMap.get(item.productId)!;
              throw new BadRequestException(
                `Insufficient stock for "${product.name}" — please refresh and try again.`,
              );
            }
          }
          // Clear user's cart
          await tx.cartItem.deleteMany({ where: { userId: user.id } });

          // Increment coupon usedCount if applicable
          if (dto.couponCode) {
            await tx.coupon.update({
              where: { code: dto.couponCode.toUpperCase().trim() },
              data: { usedCount: { increment: 1 } },
            });
          }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
      );

      return {
        ...tempOrder,
        payment: gatewayResult,
        razorpayOrderId: gatewayResult.razorpayOrderId || undefined,
        razorpayKey: gatewayResult.razorpayKey || undefined,
        gateway: gatewayResult.gateway,
        totalAmount,
      };
    }

    // ── COD path: create order, decrement stock, clear cart — all in one transaction ──
    const order = await this.prisma.$transaction(
      async (tx) => {
        // Atomic conditional stock decrement inside transaction for COD
        for (const item of mergedItems) {
          const updated = await tx.product.updateMany({
            where: {
              id: item.productId,
              stock: { gte: item.quantity },
            },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            const product = productMap.get(item.productId)!;
            throw new BadRequestException(
              `Insufficient stock for "${product.name}" — please refresh and try again.`,
            );
          }
        }

        // Increment coupon usedCount if applicable
        if (dto.couponCode) {
          await tx.coupon.update({
            where: { code: dto.couponCode.toUpperCase().trim() },
            data: { usedCount: { increment: 1 } },
          });
        }

        const created = await tx.order.create({
          data: {
            orderNumber,
            idempotencyKey: idempotencyKey || null,
            userId: user.id,
            totalAmount,
            shippingAmount,
            discountAmount,
            couponCode: dto.couponCode
              ? dto.couponCode.toUpperCase().trim()
              : null,
            addressId: dto.addressId,
            paymentMethod: 'COD',
            status: 'CONFIRMED',
            notes: dto.notes,
            items: {
              create: mergedItems.map((item) => {
                const product = productMap.get(item.productId)!;
                return {
                  productId: item.productId,
                  quantity: item.quantity,
                  size: item.size,
                  color: item.color,
                  price: product.price,
                  name: product.name,
                  image: product.images?.[0],
                };
              }),
            },
          },
          include: { items: { include: { product: true } }, address: true },
        });

        // Clear user's cart
        await tx.cartItem.deleteMany({ where: { userId: user.id } });

        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );

    // Emit event for COD order confirmation (since COD status is CONFIRMED immediately)
    await this.orderNotification.emitOrderConfirmed(order.id);

    return order;
  }

  /**
   * COD availability is admin-controlled via the DB `cod_enabled` setting —
   * the same source of truth the admin panel and storefront read, so a
   * toggle in Settings is honored by the order gate immediately (fixes the
   * drift where /settings/cod said enabled but orders were rejected).
   * Falls back to the COD_ENABLED env var (deployment default), then to
   * enabled — matching GET /settings/cod's default of `true`.
   */
  private async isCodEnabled(): Promise<boolean> {
    try {
      const status = await this.settingsService.getSetting('cod_enabled');
      if (status !== null && status !== undefined) {
        return status !== false;
      }
    } catch (err: any) {
      this.logger.warn(
        `Failed to read cod_enabled setting, falling back to env: ${err?.message || err}`,
      );
    }
    const env = this.config.get<string>('COD_ENABLED');
    if (env !== undefined && env !== null && env.trim() !== '') {
      return env.toLowerCase() === 'true';
    }
    return true;
  }

  /**
   * Merge duplicate order items (same productId + size + color) by summing quantities.
   * Prevents negative stock from split lines for the same product variant.
   */
  private mergeOrderItems(items: CreateOrderDto['items']) {
    const map = new Map<string, (typeof items)[0]>();
    for (const item of items) {
      const key = `${item.productId}|${item.size ?? ''}|${item.color ?? ''}`;
      const existing = map.get(key);
      if (existing) {
        map.set(key, {
          ...existing,
          quantity: existing.quantity + item.quantity,
        });
      } else {
        map.set(key, { ...item });
      }
    }
    return Array.from(map.values());
  }

  async findUserOrders(authId: string, page = 1, limit = 10) {
    const safeLimit = Math.min(limit, 50); // Cap pagination
    const user = await this.prisma.user.findUnique({ where: { authId } });
    if (!user) throw new NotFoundException('User not found');

    const skip = (page - 1) * safeLimit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId: user.id },
        include: {
          items: true,
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.order.count({ where: { userId: user.id } }),
    ]);
    return { orders, total, page, pages: Math.ceil(total / safeLimit) };
  }

  async findById(id: string, actor: { id: string; role: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        address: true,
        user: { select: { id: true, name: true, email: true } },
        payments: {
          include: { refunds: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (actor.role !== 'ADMIN' && order.userId !== actor.id) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition order from ${order.status} to ${dto.status}. ` +
          `Allowed transitions: ${allowed.join(', ') || 'none'}`,
      );
    }

    // Restore stock when cancelling + auto-refund paid orders (CRIT 2)
    if (
      dto.status === OrderStatusEnum.CANCELLED &&
      order.status !== 'CANCELLED'
    ) {
      const items = await this.prisma.orderItem.findMany({
        where: { orderId: id },
      });
      await this.prisma.$transaction(async (tx) => {
        for (const item of items) {
          if (!item.productId) continue;
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        await tx.order.update({
          where: { id },
          data: { status: dto.status as any, trackingId: dto.trackingId },
        });
      });

      // HIGH 9: Reverse loyalty stamp if this was a delivered order
      await this.loyaltyService.decrementProgress(id);

      // CRIT 2: Auto-refund if the order was already paid
      let refund: any = null;
      const completedPayment = await this.prisma.payment.findFirst({
        where: { orderId: id, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
      });
      if (completedPayment) {
        try {
          const result = await this.paymentsService.processRefund(
            completedPayment.id,
          );
          refund = result.refund
            ? {
                id: result.refund.id,
                status: result.refund.status,
                amount: Number(result.refund.amount),
              }
            : null;
        } catch (err: any) {
          this.logger.error(
            `Auto-refund failed for cancelled order ${id}: ${err.message}`,
          );
          refund = { status: 'FAILED', message: err.message };
        }
      }

      const updated = await this.prisma.order.findUnique({
        where: { id },
        include: { items: true },
      });
      return { ...updated, refund };
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status as any, trackingId: dto.trackingId },
      include: { items: true },
    });

    if (
      dto.status === OrderStatusEnum.CONFIRMED &&
      order.status !== 'CONFIRMED'
    ) {
      await this.orderNotification.emitOrderConfirmed(updated.id);
    }

    // Notify the customer when their order ships — links to /orders/:id
    if (
      dto.status === OrderStatusEnum.SHIPPED &&
      order.status !== 'SHIPPED'
    ) {
      await this.orderNotification.emitOrderShipped(
        updated.id,
        updated.trackingId ?? dto.trackingId,
      );
    }

    // ── Loyalty Integration ──
    // Award stamp when order reaches DELIVERED
    if (dto.status === OrderStatusEnum.DELIVERED) {
      await this.loyaltyService.incrementProgress(updated.id);
    }

    return updated;
  }

  async adminFindAll(page = 1, limit = 20, status?: string, search?: string) {
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;
    const where: Prisma.OrderWhereInput = {};
    if (status && Object.values(OrderStatusEnum).includes(status as any)) {
      where.status = status as any;
    }
    // MED 22: admin order search by order number, customer name, or email
    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { orderNumber: { contains: term, mode: 'insensitive' } },
        { user: { name: { contains: term, mode: 'insensitive' } } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true,
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { orders, total, page, pages: Math.ceil(total / safeLimit) };
  }

  async getPublicRecentPurchases() {
    const orders = await this.prisma.order.findMany({
      where: {
        status: {
          in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        items: true,
        address: true,
        user: { select: { name: true } },
      },
    });

    return orders.map((order) => {
      const city = order.address?.city || 'India';
      const productName = order.items[0]?.name || 'Premium Streetwear';
      const rawName = order.user?.name || order.address?.name || 'A customer';

      const nameParts = rawName.trim().split(/\s+/);
      let anonymizedName = 'A customer';
      if (nameParts.length > 0 && nameParts[0]) {
        const first = nameParts[0];
        const lastInit = nameParts[1] ? ` ${nameParts[1][0]}.` : '';
        anonymizedName = `${first}${lastInit}`;
      }

      return {
        purchaserName: anonymizedName,
        productName,
        city,
        createdAt: order.createdAt,
      };
    });
  }
}
