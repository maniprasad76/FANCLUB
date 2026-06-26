import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from './razorpay.service';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderConfirmedEvent } from '../common/services/notification.service.js';

/**
 * PaymentsService — Gateway Orchestrator
 *
 * This service is the single entry point for all payment operations.
 * It delegates to the Razorpay gateway service.
 *
 * Responsibilities:
 *   • Gateway routing (Razorpay for all)
 *   • Payment record lifecycle management
 *   • Transaction logging
 *   • Idempotency enforcement
 *   • Webhook event processing
 *   • Refund orchestration
 *   • Admin analytics
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private razorpayService: RazorpayService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ─────────────────────────────────────────────────────────
  // GATEWAY ROUTING
  // ─────────────────────────────────────────────────────────

  /**
   * Determine the payment gateway.
   * Everything → RAZORPAY.
   */
  private resolveGateway(
    country?: string,
    explicitGateway?: string,
  ): 'RAZORPAY' {
    return 'RAZORPAY';
  }

  // ─────────────────────────────────────────────────────────
  // CREATE PAYMENT ORDER
  // ─────────────────────────────────────────────────────────

  /**
   * Create a payment order for an existing Order.
   * Enforces idempotency — same orderId + gateway won't create duplicates.
   */
  async createPaymentOrder(
    orderId: string,
    gateway?: string,
    country?: string,
    currency: string = 'INR',
    actor?: { id: string; role: string },
  ) {
    // Fetch the order
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: { select: { email: true, name: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (actor && actor.role !== 'ADMIN' && order.userId !== actor.id) {
      throw new NotFoundException('Order not found');
    }

    // Resolve gateway
    const resolvedGateway = this.resolveGateway(country, gateway);

    // Idempotency: check if a PENDING payment already exists for this order + gateway
    // NOTE: idempotencyKey uses a UUID suffix so that retryPayment (which cancels old
    // PENDING payments) can create a new one without hitting the unique constraint.
    const idempotencyKey = `${orderId}_${resolvedGateway}_${uuidv4()}`;
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        orderId,
        gateway: resolvedGateway as any,
        status: 'PENDING',
      },
    });

    if (existingPayment) {
      // Return existing pending payment instead of creating a duplicate
      this.logger.log(
        `Returning existing pending payment ${existingPayment.id} for order ${orderId}`,
      );
      return this.formatPaymentResponse(existingPayment, resolvedGateway);
    }

    // Create the payment record
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        gateway: resolvedGateway as any,
        amount: Number(order.totalAmount),
        currency,
        status: 'PENDING',
        idempotencyKey,
        metadata: {
          orderNumber: order.orderNumber,
          customerEmail: order.user?.email,
        },
      },
    });

    // Create a CHARGE transaction record
    await this.prisma.transaction.create({
      data: {
        paymentId: payment.id,
        type: 'CHARGE',
        amount: Number(order.totalAmount),
        currency,
        status: 'INITIATED',
      },
    });

    // Create the gateway-specific order/session
    const gatewayResult = await this.razorpayService.createOrder(
      Number(order.totalAmount),
      currency,
      {
        receipt: `fan_${order.orderNumber}`,
        notes: { orderId, paymentId: payment.id },
      },
    );

    // Update order with Razorpay order ID
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        razorpayOrderId: gatewayResult.gatewayOrderId,
        paymentMethod: 'ONLINE',
      },
    });

    // Update payment with gateway order ID
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { gatewayOrderId: gatewayResult.gatewayOrderId },
    });

    return this.formatPaymentResponse(payment, resolvedGateway, gatewayResult);
  }

  /**
   * Format the payment response for the frontend.
   */
  private formatPaymentResponse(
    payment: any,
    gateway: string,
    gatewayResult?: any,
  ) {
    const base = {
      paymentId: payment.id,
      orderId: payment.orderId,
      gateway,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
    };

    return {
      ...base,
      razorpayOrderId: gatewayResult?.gatewayOrderId || payment.gatewayOrderId,
      razorpayKey: this.razorpayService.getPublishableKey(),
    };
  }

  // ─────────────────────────────────────────────────────────
  // VERIFY PAYMENT — Razorpay callback
  // ─────────────────────────────────────────────────────────

  async verifyRazorpayPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string,
    actor?: { id: string; role: string },
  ) {
    const result = await this.razorpayService.verifyPayment({
      razorpayOrderId,
      razorpayPaymentId,
      signature,
    });

    if (!result.verified) {
      throw new BadRequestException(
        'Payment verification failed: Invalid signature',
      );
    }

    // Find the payment record by gateway order ID
    const payment = await this.prisma.payment.findFirst({
      where: { gatewayOrderId: razorpayOrderId },
      include: { order: { select: { userId: true } } },
    });

    if (payment) {
      if (
        actor &&
        actor.role !== 'ADMIN' &&
        payment.order.userId !== actor.id
      ) {
        throw new NotFoundException('Payment not found');
      }

      // Update payment status
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          gatewayPaymentId: razorpayPaymentId,
          paidAt: new Date(),
        },
      });

      // Update transaction
      await this.prisma.transaction.updateMany({
        where: { paymentId: payment.id, type: 'CHARGE' },
        data: { status: 'COMPLETED', gatewayRef: razorpayPaymentId },
      });

      const order = await this.prisma.order.findUnique({
        where: { id: payment.orderId },
        select: { status: true },
      });

      // Update order status
      await this.prisma.order.updateMany({
        where: { razorpayOrderId },
        data: { paymentId: razorpayPaymentId, status: 'CONFIRMED' },
      });

      if (order && order.status !== 'CONFIRMED') {
        await this.emitOrderConfirmedEvent(payment.orderId);
      }
    } else {
      const order = await this.prisma.order.findFirst({
        where: { razorpayOrderId },
        select: { id: true, userId: true, status: true },
      });

      if (
        !order ||
        (actor && actor.role !== 'ADMIN' && order.userId !== actor.id)
      ) {
        throw new NotFoundException('Payment not found');
      }

      // Legacy fallback — update order directly (for orders created before migration)
      await this.prisma.order.updateMany({
        where: { razorpayOrderId },
        data: { paymentId: razorpayPaymentId, status: 'CONFIRMED' },
      });

      if (order.status !== 'CONFIRMED') {
        await this.emitOrderConfirmedEvent(order.id);
      }
    }

    return {
      verified: true,
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId,
    };
  }

  // ─────────────────────────────────────────────────────────
  // WEBHOOKS
  // ─────────────────────────────────────────────────────────

  /**
   * Handle a Razorpay webhook event.
   * Logs the event and processes payment.captured / payment.failed.
   */
  async handleRazorpayWebhook(rawBody: string, signature: string, body: any) {
    // Verify signature
    const isValid = this.razorpayService.verifyWebhookSignature(
      rawBody,
      signature,
    );

    // Idempotency: reject replays of already-processed webhook events
    if (signature) {
      const alreadyProcessed = await this.prisma.webhookLog.findFirst({
        where: { gateway: 'RAZORPAY', signature, processed: true },
      });
      if (alreadyProcessed) {
        this.logger.log(
          `Razorpay webhook already processed (sig=${signature.slice(0, 16)}…) — skipping`,
        );
        return { status: 'ok' };
      }
    }

    // Log the webhook — capture the ID for targeted update later
    const webhookLog = await this.prisma.webhookLog.create({
      data: {
        gateway: 'RAZORPAY',
        eventType: body.event || 'unknown',
        payload: body,
        signature,
        processed: false,
        error: isValid ? null : 'Invalid signature',
      },
    });

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // Process events — re-throw on error so Razorpay will retry delivery
    try {
      if (body.event === 'order.paid') {
        // ── Real-time order status: order is fully paid ──
        const order = body.payload?.order?.entity;
        const payment = body.payload?.payment?.entity;
        if (order?.id) {
          this.logger.log(
            `📦 order.paid webhook received — razorpayOrderId=${order.id}`,
          );
          await this.confirmPaymentByGatewayOrder(
            'RAZORPAY',
            order.id,
            payment?.id || order.id,
            payment?.method,
          );
        }
      } else if (body.event === 'payment.authorized') {
        // ── Pre-capture: payment authorized but not yet captured ──
        const payment = body.payload?.payment?.entity;
        if (payment?.order_id) {
          this.logger.log(
            `🔓 payment.authorized webhook — orderId=${payment.order_id} paymentId=${payment.id}`,
          );
          await this.markPaymentAuthorized(
            payment.order_id,
            payment.id,
            payment.method,
          );
        }
      } else if (body.event === 'payment.captured') {
        const payment = body.payload?.payment?.entity;
        if (payment?.order_id) {
          await this.confirmPaymentByGatewayOrder(
            'RAZORPAY',
            payment.order_id,
            payment.id,
            payment.method,
          );
        }
      } else if (body.event === 'payment.failed') {
        const payment = body.payload?.payment?.entity;
        if (payment?.order_id) {
          await this.failPaymentByGatewayOrder(payment.order_id);
        }
      } else if (body.event === 'refund.processed') {
        const refund = body.payload?.refund?.entity;
        if (refund?.id) {
          await this.handleGatewayRefundUpdate(refund.id, 'COMPLETED');
        }
      }

      // Mark this specific webhook log as processed (by ID, not by broad match)
      await this.prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: { processed: true },
      });
    } catch (err: any) {
      this.logger.error(`Razorpay webhook processing error: ${err.message}`);
      // Update log with error detail
      await this.prisma.webhookLog
        .update({
          where: { id: webhookLog.id },
          data: { error: err.message },
        })
        .catch(() => {});
      // Re-throw so Razorpay knows to retry
      throw err;
    }

    return { status: 'ok' };
  }

  // ─────────────────────────────────────────────────────────
  // WEBHOOK HELPERS
  // ─────────────────────────────────────────────────────────

  private async confirmPaymentByGatewayOrder(
    gateway: string,
    gatewayOrderId: string,
    gatewayPaymentId: string,
    method?: string,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { gatewayOrderId },
    });

    if (payment && payment.status !== 'COMPLETED') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          gatewayPaymentId,
          method: method || payment.method,
          paidAt: new Date(),
        },
      });

      await this.prisma.transaction.updateMany({
        where: { paymentId: payment.id, type: 'CHARGE' },
        data: { status: 'COMPLETED', gatewayRef: gatewayPaymentId },
      });

      const order = await this.prisma.order.findUnique({
        where: { id: payment.orderId },
        select: { status: true },
      });

      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentId: gatewayPaymentId, status: 'CONFIRMED' },
      });

      if (order && order.status !== 'CONFIRMED') {
        await this.emitOrderConfirmedEvent(payment.orderId);
      }
    } else if (!payment) {
      // Legacy fallback for orders without Payment records
      if (gateway === 'RAZORPAY') {
        const order = await this.prisma.order.findFirst({
          where: { razorpayOrderId: gatewayOrderId },
          select: { id: true, status: true },
        });
        if (order) {
          await this.prisma.order.update({
            where: { id: order.id },
            data: { paymentId: gatewayPaymentId, status: 'CONFIRMED' },
          });

          if (order.status !== 'CONFIRMED') {
            await this.emitOrderConfirmedEvent(order.id);
          }
        }
      }
    }
  }

  private async failPaymentByGatewayOrder(gatewayOrderId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { gatewayOrderId },
    });

    if (payment) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      await this.prisma.transaction.updateMany({
        where: { paymentId: payment.id, type: 'CHARGE' },
        data: { status: 'FAILED' },
      });
    }
  }

  /**
   * Mark a payment as authorized (pre-capture).
   * This is an intermediate state — the payment is approved but funds
   * are not yet captured. Useful for tracking the payment lifecycle.
   */
  private async markPaymentAuthorized(
    gatewayOrderId: string,
    gatewayPaymentId: string,
    method?: string,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { gatewayOrderId },
    });

    if (payment && payment.status === 'PENDING') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PROCESSING',
          gatewayPaymentId,
          method: method || payment.method,
        },
      });

      await this.prisma.transaction.updateMany({
        where: { paymentId: payment.id, type: 'CHARGE' },
        data: { status: 'AUTHORIZED', gatewayRef: gatewayPaymentId },
      });

      this.logger.log(
        `✅ Payment ${payment.id} authorized — awaiting capture`,
      );
    }
  }

  private async handleGatewayRefundUpdate(
    gatewayRefundId: string,
    status: string,
  ) {
    await this.prisma.refund.updateMany({
      where: { gatewayRefundId },
      data: {
        status: status as any,
        processedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });
  }

  // ─────────────────────────────────────────────────────────
  // REFUNDS
  // ─────────────────────────────────────────────────────────

  /**
   * Initiate a refund for a completed payment.
   * Supports partial refunds via the amount parameter.
   */
  async processRefund(paymentId: string, amount?: number, reason?: string) {
    // SECURITY: Run entire refund in a serializable transaction to prevent
    // concurrent requests from both passing the refund-limit check.
    return this.prisma.$transaction(
      async (tx) => {
        // Re-read payment with FOR UPDATE semantics inside transaction
        const payment = await tx.payment.findUnique({
          where: { id: paymentId },
          include: { refunds: true },
        });

        if (!payment) throw new NotFoundException('Payment not found');
        if (payment.status !== 'COMPLETED') {
          throw new BadRequestException('Can only refund completed payments');
        }
        if (!payment.gatewayPaymentId) {
          throw new BadRequestException(
            'No gateway payment ID found — cannot refund',
          );
        }

        // Calculate refundable amount (re-read inside transaction prevents races)
        const alreadyRefunded = payment.refunds
          .filter((r) => r.status === 'COMPLETED' || r.status === 'PROCESSING')
          .reduce((sum, r) => sum + Number(r.amount), 0);

        const refundAmount = amount || Number(payment.amount) - alreadyRefunded;
        if (refundAmount <= 0)
          throw new BadRequestException('Nothing to refund');
        if (refundAmount > Number(payment.amount) - alreadyRefunded) {
          throw new BadRequestException(
            `Maximum refundable amount is ₹${(Number(payment.amount) - alreadyRefunded).toFixed(2)}`,
          );
        }

        // Process via gateway (outside the transaction lock is fine —
        // the DB record is our source of truth; gateway is idempotent)
        const gatewayService = this.razorpayService;
        const result = await gatewayService.processRefund(
          payment.gatewayPaymentId,
          refundAmount,
        );

        const refundStatus =
          result.status === 'processed' || result.status === 'succeeded'
            ? 'COMPLETED'
            : 'PROCESSING';

        // Create refund record
        const refund = await tx.refund.create({
          data: {
            paymentId: payment.id,
            amount: refundAmount,
            reason: reason || 'Customer request',
            status: refundStatus,
            gatewayRefundId: result.gatewayRefundId,
            processedAt: refundStatus === 'COMPLETED' ? new Date() : null,
          },
        });

        // Create REFUND transaction record
        await tx.transaction.create({
          data: {
            paymentId: payment.id,
            type: 'REFUND',
            amount: refundAmount,
            currency: payment.currency,
            status: refund.status,
            gatewayRef: result.gatewayRefundId,
          },
        });

        // Update payment status
        const totalRefunded = alreadyRefunded + refundAmount;
        const isFullRefund = totalRefunded >= Number(payment.amount);

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          },
        });

        // Only mark order as REFUNDED when the gateway has confirmed it
        // (i.e. refundStatus === COMPLETED). If PROCESSING, wait for webhook.
        if (isFullRefund && refundStatus === 'COMPLETED') {
          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: 'REFUNDED' },
          });
        }

        return refund;
      },
      { isolationLevel: 'Serializable' },
    );
  }

  // ─────────────────────────────────────────────────────────
  // RETRY FAILED PAYMENT
  // ─────────────────────────────────────────────────────────

  async retryPayment(
    orderId: string,
    gateway?: string,
    actor?: { id: string; role: string },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { address: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (actor && actor.role !== 'ADMIN' && order.userId !== actor.id) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        'Can only retry payments for pending orders',
      );
    }

    // Mark any existing PENDING payments as CANCELLED
    await this.prisma.payment.updateMany({
      where: { orderId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });

    // Create a new payment order
    const country = order.address?.country || 'India';
    return this.createPaymentOrder(orderId, gateway, country, undefined, actor);
  }

  // ─────────────────────────────────────────────────────────
  // PAYMENT STATUS & QUERIES
  // ─────────────────────────────────────────────────────────

  async getPaymentStatus(
    paymentId: string,
    actor?: { id: string; role: string },
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        transactions: { orderBy: { createdAt: 'desc' } },
        refunds: { orderBy: { createdAt: 'desc' } },
        order: { select: { orderNumber: true, status: true, userId: true } },
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (actor && actor.role !== 'ADMIN' && payment.order.userId !== actor.id) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async getOrderPayments(
    orderId: string,
    actor?: { id: string; role: string },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (actor && actor.role !== 'ADMIN' && order.userId !== actor.id) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.payment.findMany({
      where: { orderId },
      include: {
        transactions: { orderBy: { createdAt: 'desc' } },
        refunds: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─────────────────────────────────────────────────────────
  // ADMIN ANALYTICS
  // ─────────────────────────────────────────────────────────

  async getPaymentStats() {
    const [
      totalPayments,
      completedPayments,
      failedPayments,
      pendingPayments,
      totalCollected,
      totalRefunded,
      byGateway,
      recentTransactions,
      recentWebhooks,
    ] = await Promise.all([
      this.prisma.payment.count(),
      this.prisma.payment.count({ where: { status: 'COMPLETED' } }),
      this.prisma.payment.count({ where: { status: 'FAILED' } }),
      this.prisma.payment.count({ where: { status: 'PENDING' } }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
      this.prisma.refund.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
      this.prisma.payment.groupBy({
        by: ['gateway'],
        _count: { gateway: true },
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
      this.prisma.transaction.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          payment: {
            select: {
              gateway: true,
              order: { select: { orderNumber: true } },
            },
          },
        },
      }),
      this.prisma.webhookLog.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const successRate =
      totalPayments > 0
        ? Math.round((completedPayments / totalPayments) * 100)
        : 0;

    return {
      totalPayments,
      completedPayments,
      failedPayments,
      pendingPayments,
      totalCollected: totalCollected._sum.amount || 0,
      totalRefunded: totalRefunded._sum.amount || 0,
      successRate,
      byGateway,
      recentTransactions,
      recentWebhooks,
    };
  }

  async getAdminPayments(
    page = 1,
    limit = 20,
    status?: string,
    gateway?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (gateway) where.gateway = gateway;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              user: { select: { name: true, email: true } },
            },
          },
          refunds: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { payments, total, page, pages: Math.ceil(total / limit) };
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
      this.logger.error(`Failed to emit order.confirmed event for order ${orderId}: ${err.message}`);
    }
  }
}
