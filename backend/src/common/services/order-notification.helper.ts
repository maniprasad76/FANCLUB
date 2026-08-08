import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import {
  OrderConfirmedEvent,
  OrderShippedEvent,
} from './notification.service.js';

/**
 * OrderNotificationHelper — Shared helper for emitting order lifecycle events.
 *
 * Extracted from OrdersService and PaymentsService to eliminate duplicate
 * implementations of the same event emission logic.
 *
 * Usage:
 *   constructor(private orderNotification: OrderNotificationHelper) {}
 *   await this.orderNotification.emitOrderConfirmed(orderId);
 *   await this.orderNotification.emitOrderShipped(orderId, trackingId);
 */
@Injectable()
export class OrderNotificationHelper {
  private readonly logger = new Logger(OrderNotificationHelper.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Fetches order details and emits the `order.confirmed` event.
   * Failures are logged but never throw — order flow is never interrupted by notification issues.
   */
  async emitOrderConfirmed(orderId: string): Promise<void> {
    try {
      const { order, customerName, customerPhone, customerEmail } =
        await this.loadOrderRecipients(orderId);

      if (!order) return;

      // Estimate delivery: 4 days from now formatted nicely
      const deliveryDate = new Date(order.createdAt);
      deliveryDate.setDate(deliveryDate.getDate() + 4);
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      };
      const estimatedDelivery = deliveryDate.toLocaleDateString(
        'en-IN',
        options,
      );

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
      this.logger.error(
        `Failed to emit order.confirmed event for order ${orderId}: ${err.message}`,
      );
    }
  }

  /**
   * Fetches order details and emits the `order.shipped` event.
   * The payload includes the courier tracking ID (if set) and a link to the
   * storefront tracking page (/orders/:id) built from FRONTEND_URL.
   * Failures are logged but never throw — order flow is never interrupted.
   */
  async emitOrderShipped(
    orderId: string,
    trackingId?: string | null,
  ): Promise<void> {
    try {
      const { order, customerName, customerPhone, customerEmail } =
        await this.loadOrderRecipients(orderId);

      if (!order) return;

      // Link to the storefront order tracking page
      const frontendUrl = (
        this.configService.get<string>('FRONTEND_URL') || ''
      ).replace(/\/$/, '');
      const trackingUrl = frontendUrl
        ? `${frontendUrl}/orders/${order.id}`
        : null;

      const eventPayload: OrderShippedEvent = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName,
        customerPhone,
        customerEmail,
        trackingId: trackingId ?? null,
        trackingUrl,
      };

      this.eventEmitter.emit('order.shipped', eventPayload);
    } catch (err: any) {
      // Don't throw/fail order flow if notification dispatch has an issue
      this.logger.error(
        `Failed to emit order.shipped event for order ${orderId}: ${err.message}`,
      );
    }
  }

  /** Shared recipient lookup for lifecycle events (order + user + address). */
  private async loadOrderRecipients(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        address: true,
      },
    });

    if (!order) {
      return {
        order: null,
        customerName: '',
        customerPhone: null,
        customerEmail: '',
      };
    }

    return {
      order,
      customerName: order.address?.name || order.user?.name || 'Customer',
      customerPhone: order.address?.phone || order.user?.phone || null,
      customerEmail: order.user?.email || '',
    };
  }
}
