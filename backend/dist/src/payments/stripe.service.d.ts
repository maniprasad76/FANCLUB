import { ConfigService } from '@nestjs/config';
import { PaymentGatewayProvider, GatewayOrder, VerificationResult, RefundResult, PaymentDetails } from './interfaces/payment-gateway.interface';
export declare class StripeService implements PaymentGatewayProvider {
    private configService;
    private readonly logger;
    private stripe;
    private readonly publishableKey;
    private readonly webhookSecret;
    constructor(configService: ConfigService);
    getPublishableKey(): string;
    isAvailable(): boolean;
    createOrder(amount: number, currency: string, metadata: Record<string, any>): Promise<GatewayOrder>;
    verifyPayment(data: Record<string, any>): Promise<VerificationResult>;
    processRefund(gatewayPaymentId: string, amount: number): Promise<RefundResult>;
    getPaymentDetails(gatewayPaymentId: string): Promise<PaymentDetails>;
    verifyWebhookSignature(rawBody: Buffer | string, signature: string): any | null;
}
