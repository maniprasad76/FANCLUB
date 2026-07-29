import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderConfirmedEvent } from './notification.service.js';

/**
 * OrderNotificationHelper — Shared helper for emitting order lifecycle events.
 *
 * Extracted from OrdersService and PaymentsService to eliminate duplicate
 * implementations of the same event emission logic.
 *
 * Usage:
 *   constructor(private orderNotification: OrderNotificationHelper) {}
 *   await this.orderNotification.emitOrderConfirmed(orderId);
 */
@Injectable()
export class OrderNotificationHelper {
  private readonly logger = new Logger(OrderNotificationHelper.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Fetches order details and emits the `order.confirmed` event.
   * Failures are logged but never throw — order flow is never interrupted by notification issues.
   */
  async emitOrderConfirmed(orderId: string): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          address: true,
        },
      });

      if (!order) return;

      const customerName =
        order.address?.name || order.user?.name || 'Customer';
      const customerPhone =
        order.address?.phone || order.user?.phone || null;
      const customerEmail = order.user?.email || '';

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
}
