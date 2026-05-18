import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
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

  constructor(private configService: ConfigService) {
    this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID') || '';
    this.keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || '';
    this.webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET') || this.keySecret;

    // Only initialize Razorpay if real keys are configured
    if (this.keyId && this.keySecret && !this.keyId.startsWith('your-')) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Razorpay = require('razorpay');
        this.razorpay = new Razorpay({
          key_id: this.keyId,
          key_secret: this.keySecret,
        });
        this.logger.log('✅ Razorpay SDK initialized');
      } catch {
        this.logger.warn('⚠️ Razorpay SDK not found. Indian payments disabled.');
      }
    } else {
      this.logger.warn('⚠️ Razorpay keys not configured. Indian payments will be stubbed.');
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
   * Create a Razorpay order for the given amount.
   * Amount is passed in the base currency unit (e.g. ₹) and converted to paise internally.
   */
  async createOrder(amount: number, currency: string, metadata: Record<string, any>): Promise<GatewayOrder> {
    if (!this.razorpay) {
      // Stub mode — return a fake order for development
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
      receipt: metadata.receipt || `tfi_${Date.now()}`,
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
   */
  async verifyPayment(data: Record<string, any>): Promise<VerificationResult> {
    const { razorpayOrderId, razorpayPaymentId, signature } = data;

    if (!this.keySecret || this.keySecret.startsWith('your-')) {
      // Stub mode — accept all payments in development
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

    const verified = expectedSignature === signature;

    return {
      verified,
      gatewayPaymentId: razorpayPaymentId,
      gatewayOrderId: razorpayOrderId,
    };
  }

  /**
   * Process a refund via Razorpay Refunds API.
   */
  async processRefund(gatewayPaymentId: string, amount: number): Promise<RefundResult> {
    if (!this.razorpay) {
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
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.webhookSecret || this.webhookSecret.startsWith('your-')) {
      return true; // Stub mode
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    return expectedSignature === signature;
  }
}
