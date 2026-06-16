import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import {
  PaymentGatewayProvider,
  GatewayOrder,
  VerificationResult,
  RefundResult,
  PaymentDetails,
} from './interfaces/payment-gateway.interface';

/**
 * RazorpayService — handles all Razorpay-specific payment operations.
 * Implements the PaymentGatewayProvider interface for gateway-agnostic orchestration.
 *
 * SECURITY: In production (NODE_ENV=production), stub mode is disabled.
 * Missing credentials in production throw ServiceUnavailableException.
 * Stub mode is only available in development for local testing.
 *
 * Razorpay flow:
 *   1. Backend creates an "order" with Razorpay API
 *   2. Frontend opens Razorpay checkout modal using that order ID
 *   3. On payment completion, Razorpay POSTs back a signature
 *   4. Backend verifies signature via HMAC-SHA256
 *   5. Razorpay also sends a webhook as backup confirmation
 */
@Injectable()
export class RazorpayService implements PaymentGatewayProvider {
  private readonly logger = new Logger(RazorpayService.name);
  private razorpay: any;
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;
  private readonly isProduction: boolean;

  constructor(private configService: ConfigService) {
    this.isProduction = configService.get<string>('NODE_ENV') === 'production';
    this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID') || '';
    this.keySecret =
      this.configService.get<string>('RAZORPAY_KEY_SECRET') || '';
    this.webhookSecret =
      this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET') ||
      this.keySecret;

    const hasRealKeys =
      this.keyId &&
      this.keySecret &&
      !this.keyId.startsWith('your-') &&
      !this.keySecret.startsWith('your-');

    if (hasRealKeys) {
      try {
        this.razorpay = new Razorpay({
          key_id: this.keyId,
          key_secret: this.keySecret,
        });
        this.logger.log('✅ Razorpay SDK initialized');
      } catch {
        this.logger.warn(
          '⚠️ Razorpay SDK not found. Indian payments disabled.',
        );
      }
    } else {
      if (this.isProduction) {
        // validateEnv should have caught this first, but defence in depth
        this.logger.error(
          '🚫 Razorpay keys not configured in production. Startup should have failed.',
        );
      } else {
        this.logger.warn(
          '⚠️ Razorpay keys not configured. Stub mode active (development only).',
        );
      }
    }
  }

  /** Returns the publishable key for the frontend to use */
  getPublishableKey(): string {
    return this.keyId;
  }

  /** Whether Razorpay is available (real keys + SDK loaded) */
  isAvailable(): boolean {
    return !!this.razorpay;
  }

  /**
   * Throws ServiceUnavailableException in production when SDK is not initialised.
   * In development, returns a stub response for local testing.
   */
  private assertAvailableOrStub<T>(stubFn: () => T): T {
    if (!this.razorpay) {
      if (this.isProduction) {
        throw new ServiceUnavailableException(
          'Razorpay payment gateway is not configured. Please contact support.',
        );
      }
      return stubFn();
    }
    return null as any; // Signal that real implementation should run
  }

  /**
   * Create a Razorpay order for the given amount.
   * Amount is passed in the base currency unit (e.g. ₹) and converted to paise internally.
   */
  async createOrder(
    amount: number,
    currency: string,
    metadata: Record<string, any>,
  ): Promise<GatewayOrder> {
    if (!this.razorpay) {
      if (this.isProduction) {
        throw new ServiceUnavailableException(
          'Razorpay payment gateway is not configured.',
        );
      }
      // Stub mode — development only
      return {
        gatewayOrderId: `order_stub_${Date.now()}`,
        amount,
        currency,
        status: 'created',
        metadata: { key: this.keyId },
      };
    }

    const order = await this.razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert ₹ to paise
      currency,
      receipt: metadata.receipt || `fan_${Date.now()}`,
      notes: metadata.notes || {},
    });

    return {
      gatewayOrderId: order.id,
      amount: order.amount / 100, // Back to ₹ for consistency
      currency: order.currency,
      status: order.status,
      metadata: { key: this.keyId },
    };
  }

  /**
   * Verify a Razorpay payment signature using HMAC-SHA256.
   * data should contain: { razorpayOrderId, razorpayPaymentId, signature }
   *
   * SECURITY: In production, missing key secret throws — no auto-pass.
   */
  async verifyPayment(data: Record<string, any>): Promise<VerificationResult> {
    const { razorpayOrderId, razorpayPaymentId, signature } = data;

    if (!this.keySecret || this.keySecret.startsWith('your-')) {
      if (this.isProduction) {
        throw new ServiceUnavailableException(
          'Razorpay is not configured for payment verification.',
        );
      }
      // Stub mode — development only
      return {
        verified: true,
        gatewayPaymentId: razorpayPaymentId,
        gatewayOrderId: razorpayOrderId,
      };
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    // Timing-safe comparison prevents side-channel attacks on HMAC signatures
    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    let receivedBuf: Buffer;
    try {
      receivedBuf = Buffer.from(signature, 'hex');
    } catch {
      return {
        verified: false,
        gatewayPaymentId: razorpayPaymentId,
        gatewayOrderId: razorpayOrderId,
      };
    }

    const verified =
      expectedBuf.length === receivedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, receivedBuf);

    return {
      verified,
      gatewayPaymentId: razorpayPaymentId,
      gatewayOrderId: razorpayOrderId,
    };
  }

  /**
   * Process a refund via Razorpay Refunds API.
   *
   * SECURITY: In production, no stub refunds — missing SDK throws.
   */
  async processRefund(
    gatewayPaymentId: string,
    amount: number,
  ): Promise<RefundResult> {
    if (!this.razorpay) {
      if (this.isProduction) {
        throw new ServiceUnavailableException(
          'Razorpay is not configured for refund processing.',
        );
      }
      // Stub mode — development only
      return {
        gatewayRefundId: `refund_stub_${Date.now()}`,
        amount,
        status: 'processed',
      };
    }

    const refund = await this.razorpay.payments.refund(gatewayPaymentId, {
      amount: Math.round(amount * 100), // Paise
      speed: 'normal',
    });

    return {
      gatewayRefundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
    };
  }

  /**
   * Get payment details from Razorpay.
   */
  async getPaymentDetails(gatewayPaymentId: string): Promise<PaymentDetails> {
    if (!this.razorpay) {
      if (this.isProduction) {
        throw new ServiceUnavailableException('Razorpay is not configured.');
      }
      return {
        gatewayPaymentId,
        amount: 0,
        currency: 'INR',
        status: 'stub',
      };
    }

    const payment = await this.razorpay.payments.fetch(gatewayPaymentId);

    return {
      gatewayPaymentId: payment.id,
      amount: payment.amount / 100,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      metadata: {
        email: payment.email,
        contact: payment.contact,
        bank: payment.bank,
        wallet: payment.wallet,
        vpa: payment.vpa,
      },
    };
  }

  /**
   * Verify a Razorpay webhook signature.
   * Uses the webhook secret (or key secret as fallback).
   *
   * SECURITY: In production, returns false (not true) when secret is missing.
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.webhookSecret || this.webhookSecret.startsWith('your-')) {
      if (this.isProduction) {
        // Fail closed in production — reject unverifiable webhooks
        this.logger.error(
          'Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not configured. Rejecting.',
        );
        return false;
      }
      // Stub mode — accept in development
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    // Timing-safe comparison prevents side-channel attacks
    try {
      const expectedBuf = Buffer.from(expectedSignature, 'hex');
      const receivedBuf = Buffer.from(signature, 'hex');
      return (
        expectedBuf.length === receivedBuf.length &&
        crypto.timingSafeEqual(expectedBuf, receivedBuf)
      );
    } catch {
      return false;
    }
  }
}
