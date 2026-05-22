import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentGatewayProvider,
  GatewayOrder,
  VerificationResult,
  RefundResult,
  PaymentDetails,
} from './interfaces/payment-gateway.interface';

/**
 * StripeService — handles all Stripe-specific payment operations.
 * Implements the PaymentGatewayProvider interface for gateway-agnostic orchestration.
 *
 * Stripe flow:
 *   1. Backend creates a Checkout Session
 *   2. Frontend redirects customer to Stripe's hosted checkout
 *   3. Customer completes payment on Stripe's page
 *   4. Stripe redirects back to our success URL
 *   5. Stripe webhook confirms payment (primary source of truth)
 */
@Injectable()
export class StripeService implements PaymentGatewayProvider {
  private readonly logger = new Logger(StripeService.name);
  private stripe: any = null;
  private readonly publishableKey: string;
  private readonly webhookSecret: string;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY') || '';
    this.publishableKey =
      this.configService.get<string>('STRIPE_PUBLISHABLE_KEY') || '';
    this.webhookSecret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';

    if (secretKey && !secretKey.startsWith('sk_test_your_')) {
      try {
        const Stripe = require('stripe');
        this.stripe = new Stripe(secretKey);
        this.logger.log('✅ Stripe SDK initialized');
      } catch (err: any) {
        this.logger.warn(`⚠️ Stripe initialization failed: ${err.message}`);
      }
    } else {
      this.logger.warn(
        '⚠️ Stripe keys not configured. International payments will be stubbed.',
      );
    }
  }

  /** Returns the publishable key for the frontend */
  getPublishableKey(): string {
    return this.publishableKey;
  }

  /** Whether Stripe is available (real keys + SDK loaded) */
  isAvailable(): boolean {
    return !!this.stripe;
  }

  /**
   * Create a Stripe Checkout Session.
   * metadata should contain orderId, orderNumber, orderDescription, customerEmail.
   */
  async createOrder(
    amount: number,
    currency: string,
    metadata: Record<string, any>,
  ): Promise<GatewayOrder> {
    if (!this.stripe) {
      // Stub mode for development
      return {
        gatewayOrderId: `cs_stub_${Date.now()}`,
        amount,
        currency,
        status: 'open',
        metadata: {
          checkoutUrl:
            metadata.successUrl || 'http://localhost:5173/order-success',
          publishableKey: this.publishableKey,
        },
      };
    }

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

    const sessionParams: any = {
      payment_method_types: ['card'],
      mode: 'payment',
      currency: currency.toLowerCase(),
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: metadata.orderDescription || 'TFI Order',
              description: metadata.orderNumber
                ? `Order #${metadata.orderNumber}`
                : undefined,
            },
            unit_amount: Math.round(amount * 100), // Stripe expects smallest currency unit
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/payment-status/${metadata.orderId}?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${frontendUrl}/payment-status/${metadata.orderId}?status=cancelled`,
      metadata: {
        orderId: metadata.orderId,
        orderNumber: metadata.orderNumber,
      },
    };

    // Add customer email if available
    if (metadata.customerEmail) {
      sessionParams.customer_email = metadata.customerEmail;
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams);

    return {
      gatewayOrderId: session.id,
      amount,
      currency,
      status: session.status || 'open',
      metadata: {
        checkoutUrl: session.url,
        publishableKey: this.publishableKey,
      },
    };
  }

  /**
   * Verify a Stripe payment by retrieving the Checkout Session.
   * data should contain: { sessionId }
   */
  async verifyPayment(data: Record<string, any>): Promise<VerificationResult> {
    const { sessionId } = data;

    if (!this.stripe) {
      return {
        verified: true,
        gatewayPaymentId: `pi_stub_${Date.now()}`,
        gatewayOrderId: sessionId,
      };
    }

    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });

    const paymentIntent = session.payment_intent;

    return {
      verified: session.payment_status === 'paid',
      gatewayPaymentId: paymentIntent?.id || '',
      gatewayOrderId: session.id,
      method: 'card',
      metadata: {
        customerEmail: session.customer_email,
        amountTotal: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency,
      },
    };
  }

  /**
   * Process a refund via Stripe Refunds API.
   */
  async processRefund(
    gatewayPaymentId: string,
    amount: number,
  ): Promise<RefundResult> {
    if (!this.stripe) {
      return {
        gatewayRefundId: `re_stub_${Date.now()}`,
        amount,
        status: 'succeeded',
      };
    }

    const refund = await this.stripe.refunds.create({
      payment_intent: gatewayPaymentId,
      amount: Math.round(amount * 100), // Smallest currency unit
    });

    return {
      gatewayRefundId: refund.id,
      amount: refund.amount ? refund.amount / 100 : amount,
      status: refund.status || 'pending',
    };
  }

  /**
   * Get payment details from Stripe.
   */
  async getPaymentDetails(gatewayPaymentId: string): Promise<PaymentDetails> {
    if (!this.stripe) {
      return {
        gatewayPaymentId,
        amount: 0,
        currency: 'INR',
        status: 'stub',
      };
    }

    const paymentIntent =
      await this.stripe.paymentIntents.retrieve(gatewayPaymentId);

    return {
      gatewayPaymentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      status: paymentIntent.status,
      method: 'card',
      metadata: paymentIntent.metadata,
    };
  }

  /**
   * Verify a Stripe webhook signature and parse the event.
   * Returns the parsed event object, or null if verification fails.
   */
  verifyWebhookSignature(
    rawBody: Buffer | string,
    signature: string,
  ): any | null {
    if (
      !this.stripe ||
      !this.webhookSecret ||
      this.webhookSecret.startsWith('whsec_your_')
    ) {
      // Stub mode — parse as JSON without verification
      try {
        return JSON.parse(
          typeof rawBody === 'string' ? rawBody : rawBody.toString(),
        );
      } catch {
        return null;
      }
    }

    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch (err: any) {
      this.logger.error(`Stripe webhook verification failed: ${err.message}`);
      return null;
    }
  }
}
