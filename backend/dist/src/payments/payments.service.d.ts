import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from './razorpay.service';
import { StripeService } from './stripe.service';
export declare class PaymentsService {
    private prisma;
    private razorpayService;
    private stripeService;
    private readonly logger;
    constructor(prisma: PrismaService, razorpayService: RazorpayService, stripeService: StripeService);
    private resolveGateway;
    createPaymentOrder(orderId: string, gateway?: string, country?: string, currency?: string): Promise<{
        razorpayOrderId: any;
        razorpayKey: string;
        paymentId: any;
        orderId: any;
        gateway: string;
        amount: any;
        currency: any;
        status: any;
    } | {
        stripeSessionId: any;
        stripePublishableKey: string;
        checkoutUrl: any;
        paymentId: any;
        orderId: any;
        gateway: string;
        amount: any;
        currency: any;
        status: any;
    }>;
    private formatPaymentResponse;
    verifyRazorpayPayment(razorpayOrderId: string, razorpayPaymentId: string, signature: string): Promise<{
        verified: boolean;
        paymentId: string;
        orderId: string;
    }>;
    verifyStripePayment(sessionId: string): Promise<{
        verified: boolean;
        status: string;
        paymentId?: undefined;
        sessionId?: undefined;
    } | {
        verified: boolean;
        paymentId: string;
        sessionId: string;
        status?: undefined;
    }>;
    handleRazorpayWebhook(rawBody: string, signature: string, body: any): Promise<{
        status: string;
    }>;
    handleStripeWebhook(rawBody: Buffer | string, signature: string): Promise<{
        received: boolean;
    }>;
    private confirmPaymentByGatewayOrder;
    private failPaymentByGatewayOrder;
    private handleGatewayRefundUpdate;
    processRefund(paymentId: string, amount?: number, reason?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        paymentId: string;
        status: import("@prisma/client").$Enums.RefundStatus;
        amount: number;
        gatewayRefundId: string | null;
        reason: string | null;
        processedAt: Date | null;
    }>;
    retryPayment(orderId: string, gateway?: string): Promise<{
        razorpayOrderId: any;
        razorpayKey: string;
        paymentId: any;
        orderId: any;
        gateway: string;
        amount: any;
        currency: any;
        status: any;
    } | {
        stripeSessionId: any;
        stripePublishableKey: string;
        checkoutUrl: any;
        paymentId: any;
        orderId: any;
        gateway: string;
        amount: any;
        currency: any;
        status: any;
    }>;
    getPaymentStatus(paymentId: string): Promise<{
        order: {
            orderNumber: string;
            status: import("@prisma/client").$Enums.OrderStatus;
        };
        transactions: {
            id: string;
            createdAt: Date;
            paymentId: string;
            status: string;
            amount: number;
            currency: string;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
            type: string;
            gatewayRef: string | null;
        }[];
        refunds: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            paymentId: string;
            status: import("@prisma/client").$Enums.RefundStatus;
            amount: number;
            gatewayRefundId: string | null;
            reason: string | null;
            processedAt: Date | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PaymentStatus;
        gatewayOrderId: string | null;
        amount: number;
        currency: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        gatewayPaymentId: string | null;
        method: string | null;
        orderId: string;
        gateway: import("@prisma/client").$Enums.PaymentGateway;
        idempotencyKey: string;
        paidAt: Date | null;
    }>;
    getOrderPayments(orderId: string): Promise<({
        transactions: {
            id: string;
            createdAt: Date;
            paymentId: string;
            status: string;
            amount: number;
            currency: string;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
            type: string;
            gatewayRef: string | null;
        }[];
        refunds: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            paymentId: string;
            status: import("@prisma/client").$Enums.RefundStatus;
            amount: number;
            gatewayRefundId: string | null;
            reason: string | null;
            processedAt: Date | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PaymentStatus;
        gatewayOrderId: string | null;
        amount: number;
        currency: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        gatewayPaymentId: string | null;
        method: string | null;
        orderId: string;
        gateway: import("@prisma/client").$Enums.PaymentGateway;
        idempotencyKey: string;
        paidAt: Date | null;
    })[]>;
    getPaymentStats(): Promise<{
        totalPayments: number;
        completedPayments: number;
        failedPayments: number;
        pendingPayments: number;
        totalCollected: number;
        totalRefunded: number;
        successRate: number;
        byGateway: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.PaymentGroupByOutputType, "gateway"[]> & {
            _count: {
                gateway: number;
            };
            _sum: {
                amount: number | null;
            };
        })[];
        recentTransactions: ({
            payment: {
                order: {
                    orderNumber: string;
                };
                gateway: import("@prisma/client").$Enums.PaymentGateway;
            };
        } & {
            id: string;
            createdAt: Date;
            paymentId: string;
            status: string;
            amount: number;
            currency: string;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
            type: string;
            gatewayRef: string | null;
        })[];
        recentWebhooks: {
            error: string | null;
            id: string;
            createdAt: Date;
            signature: string | null;
            processed: boolean;
            gateway: string;
            eventType: string;
            payload: import("@prisma/client/runtime/client").JsonValue;
        }[];
    }>;
    getAdminPayments(page?: number, limit?: number, status?: string, gateway?: string): Promise<{
        payments: ({
            order: {
                user: {
                    email: string;
                    name: string | null;
                };
                orderNumber: string;
            };
            refunds: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                paymentId: string;
                status: import("@prisma/client").$Enums.RefundStatus;
                amount: number;
                gatewayRefundId: string | null;
                reason: string | null;
                processedAt: Date | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.PaymentStatus;
            gatewayOrderId: string | null;
            amount: number;
            currency: string;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
            gatewayPaymentId: string | null;
            method: string | null;
            orderId: string;
            gateway: import("@prisma/client").$Enums.PaymentGateway;
            idempotencyKey: string;
            paidAt: Date | null;
        })[];
        total: number;
        page: number;
        pages: number;
    }>;
}
