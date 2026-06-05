/**
 * Payment Gateway Interface — contract that all payment providers must implement.
 * This enables clean gateway-agnostic orchestration in PaymentsService.
 */

export interface GatewayOrder {
  gatewayOrderId: string; // razorpay_order_id
  amount: number;
  currency: string;
  status: string;
  metadata?: Record<string, any>;
}

export interface VerificationResult {
  verified: boolean;
  gatewayPaymentId: string;
  gatewayOrderId: string;
  method?: string; // upi, card, netbanking, etc.
  metadata?: Record<string, any>;
}

export interface RefundResult {
  gatewayRefundId: string;
  amount: number;
  status: string;
}

export interface PaymentDetails {
  gatewayPaymentId: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  metadata?: Record<string, any>;
}

export interface PaymentGatewayProvider {
  /** Create a payment order/session with the gateway */
  createOrder(
    amount: number,
    currency: string,
    metadata: Record<string, any>,
  ): Promise<GatewayOrder>;

  /** Verify a payment callback from the gateway */
  verifyPayment(data: Record<string, any>): Promise<VerificationResult>;

  /** Process a refund via the gateway */
  processRefund(
    gatewayPaymentId: string,
    amount: number,
  ): Promise<RefundResult>;

  /** Get payment details from the gateway */
  getPaymentDetails(gatewayPaymentId: string): Promise<PaymentDetails>;
}
