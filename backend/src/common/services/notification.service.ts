import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';

/**
 * Payload emitted when an order transitions to CONFIRMED status.
 * Emitted from both OrdersService (COD) and PaymentsService (online payment).
 */
export interface OrderConfirmedEvent {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string;
  estimatedDelivery: string;
}

/**
 * NotificationService — Provider-agnostic notification dispatcher.
 *
 * Listens for order lifecycle events and dispatches notifications.
 *
 * Transport is config-driven (CRIT 4):
 *   NOTIFICATION_PROVIDER=console   → log the message payload (default, dev-safe)
 *   NOTIFICATION_PROVIDER=http      → POST to WHATSAPP_API_URL with
 *                                     `Authorization: Bearer WHATSAPP_API_TOKEN`
 *                                     body: { to: phone, body: message }
 *
 * Delivery is best-effort: failures are logged and never break the order flow.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly configService: ConfigService) {}

  // ─────────────────────────────────────────────────────────
  // EVENT LISTENERS
  // ─────────────────────────────────────────────────────────

  @OnEvent('order.confirmed', { async: true })
  async handleOrderConfirmed(event: OrderConfirmedEvent) {
    this.logger.log(
      `📬 order.confirmed event — order=${event.orderNumber} customer=${event.customerEmail}`,
    );

    // Attempt WhatsApp notification if phone is available
    if (event.customerPhone) {
      await this.sendOrderConfirmationWhatsApp(event);
    } else {
      this.logger.warn(
        `⚠️ No phone number for order ${event.orderNumber} — skipping WhatsApp notification`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────
  // WHATSAPP NOTIFICATION
  // ─────────────────────────────────────────────────────────

  /**
   * Send an order confirmation via WhatsApp.
   * Composes the message and delegates to the transport layer.
   */
  private async sendOrderConfirmationWhatsApp(event: OrderConfirmedEvent) {
    const message = this.composeOrderConfirmationMessage(event);

    try {
      await this.sendWhatsAppMessage(event.customerPhone!, message);
      this.logger.log(
        `✅ WhatsApp notification sent for order ${event.orderNumber} → ${event.customerPhone}`,
      );
    } catch (err: any) {
      // Non-blocking: log error but don't fail the order flow
      this.logger.error(
        `❌ WhatsApp notification failed for order ${event.orderNumber}: ${err.message}`,
      );
    }
  }

  /**
   * Compose the WhatsApp message body for order confirmation.
   */
  private composeOrderConfirmationMessage(event: OrderConfirmedEvent): string {
    return [
      `🎉 Order Confirmed!`,
      ``,
      `Hi ${event.customerName || 'there'},`,
      `Your order *${event.orderNumber}* has been confirmed.`,
      ``,
      `💰 Amount: ₹${Number(event.totalAmount).toLocaleString('en-IN')}`,
      `📦 Estimated Delivery: ${event.estimatedDelivery}`,
      ``,
      `Thank you for shopping with FAN Club! 🏆`,
    ].join('\n');
  }

  // ─────────────────────────────────────────────────────────
  // TRANSPORT LAYER
  // ─────────────────────────────────────────────────────────

  /**
   * Send a WhatsApp message to the given phone number.
   *
   * Config-driven (CRIT 4):
   *   - NOTIFICATION_PROVIDER=http + WHATSAPP_API_URL + WHATSAPP_API_TOKEN
   *     → real HTTP delivery to any provider that accepts
   *       { to, body } with a Bearer token (Meta Cloud API, Twilio, Gupshup…)
   *   - otherwise → logs the payload (safe default, no external dependency)
   */
  private async sendWhatsAppMessage(
    phone: string,
    message: string,
  ): Promise<void> {
    const provider = this.configService.get<string>(
      'NOTIFICATION_PROVIDER',
      'console',
    );

    if (provider.toLowerCase() !== 'http') {
      this.logger.log(`📱 [console] WhatsApp message to ${phone}:\n${message}`);
      return;
    }

    const apiUrl = this.configService.get<string>('WHATSAPP_API_URL');
    const apiToken = this.configService.get<string>('WHATSAPP_API_TOKEN');

    if (!apiUrl || !apiToken) {
      this.logger.warn(
        'NOTIFICATION_PROVIDER=http but WHATSAPP_API_URL/WHATSAPP_API_TOKEN missing — falling back to console',
      );
      this.logger.log(`📱 [console] WhatsApp message to ${phone}:\n${message}`);
      return;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ to: phone, body: message }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(
        `WhatsApp API responded ${response.status} ${response.statusText} ${detail.slice(0, 200)}`,
      );
    }
  }
}
