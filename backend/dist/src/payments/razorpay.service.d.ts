import { ConfigService } from '@nestjs/config';
import { PaymentGatewayProvider, GatewayOrder, VerificationResult, RefundResult, PaymentDetails } from './interfaces/payment-gateway.interface';
export declare class RazorpayService implements PaymentGatewayProvider {
    private configService;
    private readonly logger;
    private razorpay;
    private readonly keyId;
    private readonly keySecret;
    private readonly webhookSecret;
    constructor(configService: ConfigService);
    getPublishableKey(): string;
    isAvailable(): boolean;
    createOrder(amount: number, currency: string, metadata: Record<string, any>): Promise<GatewayOrder>;
    verifyPayment(data: Record<string, any>): Promise<VerificationResult>;
    processRefund(gatewayPaymentId: string, amount: number): Promise<RefundResult>;
    getPaymentDetails(gatewayPaymentId: string): Promise<PaymentDetails>;
    verifyWebhookSignature(rawBody: string, signature: string): boolean;
}
