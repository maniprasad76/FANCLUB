import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderConfirmedEvent } from '../common/services/notification.service.js';

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
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
    private config: ConfigService,
    private couponsService: CouponsService,
    private eventEmitter: EventEmitter2,
    private loyaltyService: LoyaltyService,
  ) {}

  /**
   * Creates an order with ZERO-TRUST pricing.
   * All prices are fetched from the database — nothing from the client is trusted.
   *
   * Security hardening:
   * 1. paymentMethod is a strict enum (COD | ONLINE) — validated by DTO
   * 2. COD is gated by server-side COD_ENABLED env var
   * 3. Duplicate productId lines are merged before stock checks
   * 4. Stock decremented with conditional WHERE stock >= qty (atomic)
   * 5. Gateway session created BEFORE clearing cart/stock to prevent orphaned state
   */
  async create(authId: string, dto: CreateOrderDto) {
    const user = await this.prisma.user.findUnique({ where: { authId } });
    if (!user) throw new NotFoundException('User not found');

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // ── COD availability gate ──
    const paymentMethod = dto.paymentMethod ?? PaymentMethodEnum.COD;
    if (paymentMethod === PaymentMethodEnum.COD) {
      const codEnabled = this.config.get<string>('COD_ENABLED');
      if (!codEnabled || codEnabled.toLowerCase() !== 'true') {
        throw new BadRequestException(
          'Cash on Delivery is not available for this store.',
        );
      }
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
      const tempOrder = await this.prisma.order.create({
        data: {
          orderNumber,
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
    await this.emitOrderConfirmedEvent(order.id);

    return order;
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

    // Restore stock when cancelling
    if (
      dto.status === OrderStatusEnum.CANCELLED &&
      order.status !== 'CANCELLED'
    ) {
      const items = await this.prisma.orderItem.findMany({
        where: { orderId: id },
      });
      await this.prisma.$transaction(async (tx) => {
        for (const item of items) {
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
      return this.prisma.order.findUnique({
        where: { id },
        include: { items: true },
      });
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status as any, trackingId: dto.trackingId },
      include: { items: true },
    });

    if (dto.status === OrderStatusEnum.CONFIRMED && order.status !== 'CONFIRMED') {
      await this.emitOrderConfirmedEvent(updated.id);
    }

    // ── Loyalty Integration ──
    // Award stamp when order reaches DELIVERED
    if (dto.status === OrderStatusEnum.DELIVERED) {
      await this.loyaltyService.incrementProgress(updated.id);
    }
    // Reverse stamp when a previously-delivered order is cancelled
    if (dto.status === OrderStatusEnum.CANCELLED) {
      await this.loyaltyService.decrementProgress(updated.id);
    }

    return updated;
  }

  async adminFindAll(page = 1, limit = 20, status?: string) {
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;
    const where: Prisma.OrderWhereInput = {};
    if (status && Object.values(OrderStatusEnum).includes(status as any)) {
      where.status = status as any;
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

  /**
   * Helper to fetch order details and emit the order.confirmed event.
   */
  private async emitOrderConfirmedEvent(orderId: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          address: true,
        },
      });

      if (!order) return;

      const customerName = order.address?.name || order.user?.name || 'Customer';
      const customerPhone = order.address?.phone || order.user?.phone || null;
      const customerEmail = order.user?.email || '';

      // Estimate delivery: 4 days from now formatted nicely
      const deliveryDate = new Date(order.createdAt);
      deliveryDate.setDate(deliveryDate.getDate() + 4);
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
      const estimatedDelivery = deliveryDate.toLocaleDateString('en-IN', options);

      const eventPayload: OrderConfirmedEvent = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: Number(order.totalAmount),
        customerName,
        customerPhone,
        customerEmail,
        estimatedDelivery,
      };

      this.eventEmitter.emit('order.confirmed', eventPayload);
    } catch (err: any) {
      // Don't throw/fail order flow if notification dispatch has an issue
      console.error(`Failed to emit order.confirmed event for order ${orderId}:`, err);
    }
  }
}
