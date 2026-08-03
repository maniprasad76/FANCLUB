import { Injectable, Logger } from '@nestjs/common';
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
 * Currently logs WhatsApp notification payloads to stdout.
 *
 * To activate real WhatsApp delivery:
 *   1. Set WHATSAPP_API_URL and WHATSAPP_API_TOKEN env vars
 *   2. Replace the stub in sendWhatsAppMessage() with your SDK call
 *      (Meta Cloud API, Twilio, Gupshup, etc.)
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

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
  // TRANSPORT LAYER (Swap this with your WhatsApp SDK)
  // ─────────────────────────────────────────────────────────

  /**
   * Send a WhatsApp message to the given phone number.
   *
   * 🔌 PLUG YOUR PROVIDER HERE:
   *
   * Meta Cloud API example:
   *   await axios.post(
   *     `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
   *     { messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: message } },
   *     { headers: { Authorization: `Bearer ${token}` } },
   *   );
   *
   * Twilio example:
   *   await twilioClient.messages.create({
   *     from: 'whatsapp:+14155238886',
   *     to: `whatsapp:${phone}`,
   *     body: message,
   *   });
   */
  private async sendWhatsAppMessage(
    phone: string,
    message: string,
  ): Promise<void> {
    // ── STUB: Log the message payload for now ──
    this.logger.log(`📱 [STUB] WhatsApp message to ${phone}:\n${message}`);

    // When ready, uncomment and configure:
    // const apiUrl = process.env.WHATSAPP_API_URL;
    // const apiToken = process.env.WHATSAPP_API_TOKEN;
    // if (!apiUrl || !apiToken) {
    //   this.logger.warn('WhatsApp API not configured — skipping');
    //   return;
    // }
    // await axios.post(apiUrl, { to: phone, body: message }, {
    //   headers: { Authorization: `Bearer ${apiToken}` },
    // });
  }
}
