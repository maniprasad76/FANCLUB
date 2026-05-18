export interface GatewayOrder {
    gatewayOrderId: string;
    amount: number;
    currency: string;
    status: string;
    metadata?: Record<string, any>;
}
export interface VerificationResult {
    verified: boolean;
    gatewayPaymentId: string;
    gatewayOrderId: string;
    method?: string;
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
    createOrder(amount: number, currency: string, metadata: Record<string, any>): Promise<GatewayOrder>;
    verifyPayment(data: Record<string, any>): Promise<VerificationResult>;
    processRefund(gatewayPaymentId: string, amount: number): Promise<RefundResult>;
    getPaymentDetails(gatewayPaymentId: string): Promise<PaymentDetails>;
}
