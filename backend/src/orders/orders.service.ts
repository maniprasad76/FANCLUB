import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

/** Shipping threshold & cost — single source of truth */
const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_COST = 99;

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
  ) {}

  /**
   * Creates an order with ZERO-TRUST pricing.
   * All prices are fetched from the database — nothing from the client is trusted.
   * The entire operation is wrapped in a Prisma transaction for atomicity.
   *
   * For ONLINE payments, creates a Payment record via the dual-gateway system
   * (Razorpay for India, Stripe for international).
   */
  async create(authId: string, dto: CreateOrderDto) {
    const user = await this.prisma.user.findUnique({ where: { authId } });
    if (!user) throw new NotFoundException('User not found');

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // ── Fetch all products from DB to get trusted prices ──
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // ── Validate every item ──
    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(
          `Product ${item.productId} not found or inactive`,
        );
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`,
        );
      }
    }

    // ── Server-side price calculation ──
    const subtotal = dto.items.reduce((sum, item) => {
      const product = productMap.get(item.productId)!;
      return sum + product.price * item.quantity;
    }, 0);

    const shippingAmount =
      subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const totalAmount = subtotal + shippingAmount;

    const orderNumber = `TFI-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`;

    // ── Resolve the customer's country from their address ──
    let customerCountry = dto.country || 'India';
    if (dto.addressId) {
      const address = await this.prisma.address.findFirst({
        where: { id: dto.addressId, userId: user.id },
      });
      if (!address) throw new BadRequestException('Invalid shipping address');
      if (address) customerCountry = address.country || 'India';
    }

    // ── Atomic transaction: create order + validate stock + clear cart + decrement stock ──
    const order = await this.prisma.$transaction(async (tx) => {
      // Validate stock INSIDE the transaction to prevent race conditions
      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;
        const current = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        });
        if (!current || current.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${product.name}". Available: ${current?.stock ?? 0}, requested: ${item.quantity}`,
          );
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          totalAmount,
          shippingAmount,
          addressId: dto.addressId,
          paymentMethod: dto.paymentMethod || 'COD',
          status: dto.paymentMethod === 'ONLINE' ? 'PENDING' : 'CONFIRMED',
          notes: dto.notes,
          items: {
            create: dto.items.map((item) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                price: product.price, // from DB, not client
                name: product.name, // from DB, not client
                image: product.images?.[0], // from DB, not client
              };
            }),
          },
        },
        include: { items: { include: { product: true } }, address: true },
      });

      // Clear user's cart
      await tx.cartItem.deleteMany({ where: { userId: user.id } });

      // Decrement stock for each item (inside transaction for atomicity)
      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return created;
    });

    // ── For ONLINE payments, create a payment order via the dual-gateway system ──
    if (dto.paymentMethod === 'ONLINE') {
      const paymentResult: any = await this.paymentsService.createPaymentOrder(
        order.id,
        dto.gateway,
        customerCountry,
        dto.currency || 'INR',
      );

      return {
        ...order,
        payment: paymentResult,
        // Legacy compatibility fields for existing frontend
        razorpayOrderId: paymentResult.razorpayOrderId || undefined,
        razorpayKey: paymentResult.razorpayKey || undefined,
        stripeSessionId: paymentResult.stripeSessionId || undefined,
        checkoutUrl: paymentResult.checkoutUrl || undefined,
        gateway: paymentResult.gateway,
        totalAmount,
      };
    }

    return order;
  }

  async findUserOrders(authId: string, page = 1, limit = 10) {
    const user = await this.prisma.user.findUnique({ where: { authId } });
    if (!user) throw new NotFoundException('User not found');

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId: user.id },
        include: {
          items: true,
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where: { userId: user.id } }),
    ]);
    return { orders, total, page, pages: Math.ceil(total / limit) };
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
    return this.prisma.order.update({
      where: { id },
      data: { status: dto.status as any, trackingId: dto.trackingId },
      include: { items: true },
    });
  }

  async adminFindAll(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status as any;

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
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { orders, total, page, pages: Math.ceil(total / limit) };
  }
}
