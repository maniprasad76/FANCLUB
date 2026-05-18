import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from './razorpay.service';
import { StripeService } from './stripe.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * PaymentsService — Gateway Orchestrator
 *
 * This service is the single entry point for all payment operations.
 * It delegates to the appropriate gateway service (Razorpay or Stripe)
 * based on the customer's country or explicit gateway selection.
 *
 * Responsibilities:
 *   • Gateway routing (India → Razorpay, International → Stripe)
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
    private stripeService: StripeService,
  ) {}

  // ─────────────────────────────────────────────────────────
  // GATEWAY ROUTING
  // ─────────────────────────────────────────────────────────

  /**
   * Determine the payment gateway based on country.
   * India → RAZORPAY, everything else → STRIPE.
   */
  private resolveGateway(country?: string, explicitGateway?: string): 'RAZORPAY' | 'STRIPE' {
    if (explicitGateway) {
      const g = explicitGateway.toUpperCase();
      if (g === 'RAZORPAY' || g === 'STRIPE') return g;
    }
    // Auto-route: India → Razorpay, else → Stripe
    const c = (country || 'India').toLowerCase().trim();
    if (c === 'india' || c === 'in' || c === 'ind') return 'RAZORPAY';
    return 'STRIPE';
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
  ) {
    // Fetch the order
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: { select: { email: true, name: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Resolve gateway
    const resolvedGateway = this.resolveGateway(country, gateway);

    // Idempotency: check if a PENDING payment already exists for this order + gateway
    const idempotencyKey = `${orderId}_${resolvedGateway}_${Date.now()}`;
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        orderId,
        gateway: resolvedGateway as any,
        status: 'PENDING',
      },
    });

    if (existingPayment) {
      // Return existing pending payment instead of creating a duplicate
      this.logger.log(`Returning existing pending payment ${existingPayment.id} for order ${orderId}`);
      return this.formatPaymentResponse(existingPayment, resolvedGateway);
    }

    // Create the payment record
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        gateway: resolvedGateway as any,
        amount: order.totalAmount,
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
        amount: order.totalAmount,
        currency,
        status: 'INITIATED',
      },
    });

    // Create the gateway-specific order/session
    let gatewayResult;

    if (resolvedGateway === 'RAZORPAY') {
      gatewayResult = await this.razorpayService.createOrder(order.totalAmount, currency, {
        receipt: `tfi_${order.orderNumber}`,
        notes: { orderId, paymentId: payment.id },
      });

      // Update order with Razorpay order ID
      await this.prisma.order.update({
        where: { id: orderId },
        data: { razorpayOrderId: gatewayResult.gatewayOrderId, paymentMethod: 'ONLINE' },
      });
    } else {
      gatewayResult = await this.stripeService.createOrder(order.totalAmount, currency, {
        orderId,
        orderNumber: order.orderNumber,
        orderDescription: `TFICLUB Order #${order.orderNumber}`,
        customerEmail: order.user?.email,
      });

      // Update order with Stripe session ID
      await this.prisma.order.update({
        where: { id: orderId },
        data: { stripeSessionId: gatewayResult.gatewayOrderId, paymentMethod: 'ONLINE' },
      });
    }

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
  private formatPaymentResponse(payment: any, gateway: string, gatewayResult?: any) {
    const base = {
      paymentId: payment.id,
      orderId: payment.orderId,
      gateway,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
    };

    if (gateway === 'RAZORPAY') {
      return {
        ...base,
        razorpayOrderId: gatewayResult?.gatewayOrderId || payment.gatewayOrderId,
        razorpayKey: this.razorpayService.getPublishableKey(),
      };
    } else {
      return {
        ...base,
        stripeSessionId: gatewayResult?.gatewayOrderId || payment.gatewayOrderId,
        stripePublishableKey: this.stripeService.getPublishableKey(),
        checkoutUrl: gatewayResult?.metadata?.checkoutUrl,
      };
    }
  }

  // ─────────────────────────────────────────────────────────
  // VERIFY PAYMENT — Razorpay callback
  // ─────────────────────────────────────────────────────────

  async verifyRazorpayPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string,
  ) {
    const result = await this.razorpayService.verifyPayment({
      razorpayOrderId,
      razorpayPaymentId,
      signature,
    });

    if (!result.verified) {
      throw new BadRequestException('Payment verification failed: Invalid signature');
    }

    // Find the payment record by gateway order ID
    const payment = await this.prisma.payment.findFirst({
      where: { gatewayOrderId: razorpayOrderId },
    });

    if (payment) {
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

      // Update order status
      await this.prisma.order.updateMany({
        where: { razorpayOrderId },
        data: { paymentId: razorpayPaymentId, status: 'CONFIRMED' },
      });
    } else {
      // Legacy fallback — update order directly (for orders created before migration)
      await this.prisma.order.updateMany({
        where: { razorpayOrderId },
        data: { paymentId: razorpayPaymentId, status: 'CONFIRMED' },
      });
    }

    return { verified: true, paymentId: razorpayPaymentId, orderId: razorpayOrderId };
  }

  // ─────────────────────────────────────────────────────────
  // VERIFY PAYMENT — Stripe session check
  // ─────────────────────────────────────────────────────────

  async verifyStripePayment(sessionId: string) {
    const result = await this.stripeService.verifyPayment({ sessionId });

    if (!result.verified) {
      return { verified: false, status: 'unpaid' };
    }

    // Find payment record
    const payment = await this.prisma.payment.findFirst({
      where: { gatewayOrderId: sessionId },
    });

    if (payment && payment.status !== 'COMPLETED') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          gatewayPaymentId: result.gatewayPaymentId,
          method: result.method || 'card',
          paidAt: new Date(),
        },
      });

      await this.prisma.transaction.updateMany({
        where: { paymentId: payment.id, type: 'CHARGE' },
        data: { status: 'COMPLETED', gatewayRef: result.gatewayPaymentId },
      });

      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentId: result.gatewayPaymentId, status: 'CONFIRMED' },
      });
    }

    return { verified: true, paymentId: result.gatewayPaymentId, sessionId };
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
    const isValid = this.razorpayService.verifyWebhookSignature(rawBody, signature);

    // Log the webhook
    await this.prisma.webhookLog.create({
      data: {
        gateway: 'RAZORPAY',
        eventType: body.event || 'unknown',
        payload: body,
        signature,
        processed: isValid,
        error: isValid ? null : 'Invalid signature',
      },
    });

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // Process events
    try {
      if (body.event === 'payment.captured') {
        const payment = body.payload?.payment?.entity;
        if (payment?.order_id) {
          await this.confirmPaymentByGatewayOrder('RAZORPAY', payment.order_id, payment.id, payment.method);
        }
      } else if (body.event === 'payment.failed') {
        const payment = body.payload?.payment?.entity;
        if (payment?.order_id) {
          await this.failPaymentByGatewayOrder(payment.order_id);
        }
      } else if (body.event === 'refund.processed') {
        const refund = body.payload?.refund?.entity;
        if (refund?.payment_id) {
          await this.handleGatewayRefundUpdate(refund.id, 'COMPLETED');
        }
      }

      // Mark webhook as processed
      await this.prisma.webhookLog.updateMany({
        where: { gateway: 'RAZORPAY', eventType: body.event, processed: false },
        data: { processed: true },
      });
    } catch (err: any) {
      this.logger.error(`Razorpay webhook processing error: ${err.message}`);
    }

    return { status: 'ok' };
  }

  /**
   * Handle a Stripe webhook event.
   */
  async handleStripeWebhook(rawBody: Buffer | string, signature: string) {
    const event = this.stripeService.verifyWebhookSignature(rawBody, signature);

    // Log the webhook
    await this.prisma.webhookLog.create({
      data: {
        gateway: 'STRIPE',
        eventType: event?.type || 'unknown',
        payload: event as any || { raw: 'verification_failed' },
        signature,
        processed: !!event,
        error: event ? null : 'Invalid signature',
      },
    });

    if (!event) {
      throw new BadRequestException('Invalid webhook signature');
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as any;
          if (session.payment_status === 'paid') {
            await this.confirmPaymentByGatewayOrder(
              'STRIPE',
              session.id,
              session.payment_intent,
              'card',
            );
          }
          break;
        }
        case 'payment_intent.payment_failed': {
          const intent = event.data.object as any;
          // Find payment by gateway payment ID
          const payment = await this.prisma.payment.findFirst({
            where: { gatewayPaymentId: intent.id },
          });
          if (payment) {
            await this.failPaymentByGatewayOrder(payment.gatewayOrderId || '');
          }
          break;
        }
        case 'charge.refunded': {
          const charge = event.data.object as any;
          if (charge.refunds?.data?.length) {
            const refund = charge.refunds.data[0];
            await this.handleGatewayRefundUpdate(refund.id, 'COMPLETED');
          }
          break;
        }
      }
    } catch (err: any) {
      this.logger.error(`Stripe webhook processing error: ${err.message}`);
    }

    return { received: true };
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

      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentId: gatewayPaymentId, status: 'CONFIRMED' },
      });
    } else if (!payment) {
      // Legacy fallback for orders without Payment records
      if (gateway === 'RAZORPAY') {
        await this.prisma.order.updateMany({
          where: { razorpayOrderId: gatewayOrderId },
          data: { paymentId: gatewayPaymentId, status: 'CONFIRMED' },
        });
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

  private async handleGatewayRefundUpdate(gatewayRefundId: string, status: string) {
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
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { refunds: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'COMPLETED') {
      throw new BadRequestException('Can only refund completed payments');
    }
    if (!payment.gatewayPaymentId) {
      throw new BadRequestException('No gateway payment ID found — cannot refund');
    }

    // Calculate refundable amount
    const alreadyRefunded = payment.refunds
      .filter((r) => r.status === 'COMPLETED' || r.status === 'PROCESSING')
      .reduce((sum, r) => sum + r.amount, 0);

    const refundAmount = amount || (payment.amount - alreadyRefunded);
    if (refundAmount <= 0) throw new BadRequestException('Nothing to refund');
    if (refundAmount > payment.amount - alreadyRefunded) {
      throw new BadRequestException(`Maximum refundable amount is ₹${(payment.amount - alreadyRefunded).toFixed(2)}`);
    }

    // Process via gateway
    const gateway = payment.gateway === 'RAZORPAY' ? this.razorpayService : this.stripeService;
    const result = await gateway.processRefund(payment.gatewayPaymentId, refundAmount);

    // Create refund record
    const refund = await this.prisma.refund.create({
      data: {
        paymentId: payment.id,
        amount: refundAmount,
        reason: reason || 'Customer request',
        status: result.status === 'processed' || result.status === 'succeeded' ? 'COMPLETED' : 'PROCESSING',
        gatewayRefundId: result.gatewayRefundId,
        processedAt: result.status === 'processed' || result.status === 'succeeded' ? new Date() : null,
      },
    });

    // Create REFUND transaction
    await this.prisma.transaction.create({
      data: {
        paymentId: payment.id,
        type: 'REFUND',
        amount: refundAmount,
        currency: payment.currency,
        status: refund.status,
        gatewayRef: result.gatewayRefundId,
      },
    });

    // Update payment status if fully refunded
    const totalRefunded = alreadyRefunded + refundAmount;
    const isFullRefund = totalRefunded >= payment.amount;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      },
    });

    // Update order status if fully refunded
    if (isFullRefund) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'REFUNDED' },
      });
    }

    return refund;
  }

  // ─────────────────────────────────────────────────────────
  // RETRY FAILED PAYMENT
  // ─────────────────────────────────────────────────────────

  async retryPayment(orderId: string, gateway?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { address: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Can only retry payments for pending orders');
    }

    // Mark any existing PENDING payments as CANCELLED
    await this.prisma.payment.updateMany({
      where: { orderId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });

    // Create a new payment order
    const country = order.address?.country || 'India';
    return this.createPaymentOrder(orderId, gateway, country);
  }

  // ─────────────────────────────────────────────────────────
  // PAYMENT STATUS & QUERIES
  // ─────────────────────────────────────────────────────────

  async getPaymentStatus(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        transactions: { orderBy: { createdAt: 'desc' } },
        refunds: { orderBy: { createdAt: 'desc' } },
        order: { select: { orderNumber: true, status: true } },
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async getOrderPayments(orderId: string) {
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

    const successRate = totalPayments > 0
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

  async getAdminPayments(page = 1, limit = 20, status?: string, gateway?: string) {
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
}
