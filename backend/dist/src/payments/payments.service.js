"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const razorpay_service_1 = require("./razorpay.service");
const stripe_service_1 = require("./stripe.service");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    prisma;
    razorpayService;
    stripeService;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(prisma, razorpayService, stripeService) {
        this.prisma = prisma;
        this.razorpayService = razorpayService;
        this.stripeService = stripeService;
    }
    resolveGateway(country, explicitGateway) {
        if (explicitGateway) {
            const g = explicitGateway.toUpperCase();
            if (g === 'RAZORPAY' || g === 'STRIPE')
                return g;
        }
        const c = (country || 'India').toLowerCase().trim();
        if (c === 'india' || c === 'in' || c === 'ind')
            return 'RAZORPAY';
        return 'STRIPE';
    }
    async createPaymentOrder(orderId, gateway, country, currency = 'INR') {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true, user: { select: { email: true, name: true } } },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const resolvedGateway = this.resolveGateway(country, gateway);
        const idempotencyKey = `${orderId}_${resolvedGateway}_${Date.now()}`;
        const existingPayment = await this.prisma.payment.findFirst({
            where: {
                orderId,
                gateway: resolvedGateway,
                status: 'PENDING',
            },
        });
        if (existingPayment) {
            this.logger.log(`Returning existing pending payment ${existingPayment.id} for order ${orderId}`);
            return this.formatPaymentResponse(existingPayment, resolvedGateway);
        }
        const payment = await this.prisma.payment.create({
            data: {
                orderId,
                gateway: resolvedGateway,
                amount: order.totalAmount,
                currency,
                status: 'PENDING',
                idempotencyKey,
                metadata: {
                    orderNumber: order.orderNumber,
                    customerEmail: order.user?.email,
                },
            },
        });
        await this.prisma.transaction.create({
            data: {
                paymentId: payment.id,
                type: 'CHARGE',
                amount: order.totalAmount,
                currency,
                status: 'INITIATED',
            },
        });
        let gatewayResult;
        if (resolvedGateway === 'RAZORPAY') {
            gatewayResult = await this.razorpayService.createOrder(order.totalAmount, currency, {
                receipt: `tfi_${order.orderNumber}`,
                notes: { orderId, paymentId: payment.id },
            });
            await this.prisma.order.update({
                where: { id: orderId },
                data: { razorpayOrderId: gatewayResult.gatewayOrderId, paymentMethod: 'ONLINE' },
            });
        }
        else {
            gatewayResult = await this.stripeService.createOrder(order.totalAmount, currency, {
                orderId,
                orderNumber: order.orderNumber,
                orderDescription: `TFICLUB Order #${order.orderNumber}`,
                customerEmail: order.user?.email,
            });
            await this.prisma.order.update({
                where: { id: orderId },
                data: { stripeSessionId: gatewayResult.gatewayOrderId, paymentMethod: 'ONLINE' },
            });
        }
        await this.prisma.payment.update({
            where: { id: payment.id },
            data: { gatewayOrderId: gatewayResult.gatewayOrderId },
        });
        return this.formatPaymentResponse(payment, resolvedGateway, gatewayResult);
    }
    formatPaymentResponse(payment, gateway, gatewayResult) {
        const base = {
            paymentId: payment.id,
            orderId: payment.orderId,
            gateway,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
        };
        if (gateway === 'RAZORPAY') {
            return {
                ...base,
                razorpayOrderId: gatewayResult?.gatewayOrderId || payment.gatewayOrderId,
                razorpayKey: this.razorpayService.getPublishableKey(),
            };
        }
        else {
            return {
                ...base,
                stripeSessionId: gatewayResult?.gatewayOrderId || payment.gatewayOrderId,
                stripePublishableKey: this.stripeService.getPublishableKey(),
                checkoutUrl: gatewayResult?.metadata?.checkoutUrl,
            };
        }
    }
    async verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, signature) {
        const result = await this.razorpayService.verifyPayment({
            razorpayOrderId,
            razorpayPaymentId,
            signature,
        });
        if (!result.verified) {
            throw new common_1.BadRequestException('Payment verification failed: Invalid signature');
        }
        const payment = await this.prisma.payment.findFirst({
            where: { gatewayOrderId: razorpayOrderId },
        });
        if (payment) {
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'COMPLETED',
                    gatewayPaymentId: razorpayPaymentId,
                    paidAt: new Date(),
                },
            });
            await this.prisma.transaction.updateMany({
                where: { paymentId: payment.id, type: 'CHARGE' },
                data: { status: 'COMPLETED', gatewayRef: razorpayPaymentId },
            });
            await this.prisma.order.updateMany({
                where: { razorpayOrderId },
                data: { paymentId: razorpayPaymentId, status: 'CONFIRMED' },
            });
        }
        else {
            await this.prisma.order.updateMany({
                where: { razorpayOrderId },
                data: { paymentId: razorpayPaymentId, status: 'CONFIRMED' },
            });
        }
        return { verified: true, paymentId: razorpayPaymentId, orderId: razorpayOrderId };
    }
    async verifyStripePayment(sessionId) {
        const result = await this.stripeService.verifyPayment({ sessionId });
        if (!result.verified) {
            return { verified: false, status: 'unpaid' };
        }
        const payment = await this.prisma.payment.findFirst({
            where: { gatewayOrderId: sessionId },
        });
        if (payment && payment.status !== 'COMPLETED') {
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'COMPLETED',
                    gatewayPaymentId: result.gatewayPaymentId,
                    method: result.method || 'card',
                    paidAt: new Date(),
                },
            });
            await this.prisma.transaction.updateMany({
                where: { paymentId: payment.id, type: 'CHARGE' },
                data: { status: 'COMPLETED', gatewayRef: result.gatewayPaymentId },
            });
            await this.prisma.order.update({
                where: { id: payment.orderId },
                data: { paymentId: result.gatewayPaymentId, status: 'CONFIRMED' },
            });
        }
        return { verified: true, paymentId: result.gatewayPaymentId, sessionId };
    }
    async handleRazorpayWebhook(rawBody, signature, body) {
        const isValid = this.razorpayService.verifyWebhookSignature(rawBody, signature);
        await this.prisma.webhookLog.create({
            data: {
                gateway: 'RAZORPAY',
                eventType: body.event || 'unknown',
                payload: body,
                signature,
                processed: isValid,
                error: isValid ? null : 'Invalid signature',
            },
        });
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
        try {
            if (body.event === 'payment.captured') {
                const payment = body.payload?.payment?.entity;
                if (payment?.order_id) {
                    await this.confirmPaymentByGatewayOrder('RAZORPAY', payment.order_id, payment.id, payment.method);
                }
            }
            else if (body.event === 'payment.failed') {
                const payment = body.payload?.payment?.entity;
                if (payment?.order_id) {
                    await this.failPaymentByGatewayOrder(payment.order_id);
                }
            }
            else if (body.event === 'refund.processed') {
                const refund = body.payload?.refund?.entity;
                if (refund?.payment_id) {
                    await this.handleGatewayRefundUpdate(refund.id, 'COMPLETED');
                }
            }
            await this.prisma.webhookLog.updateMany({
                where: { gateway: 'RAZORPAY', eventType: body.event, processed: false },
                data: { processed: true },
            });
        }
        catch (err) {
            this.logger.error(`Razorpay webhook processing error: ${err.message}`);
        }
        return { status: 'ok' };
    }
    async handleStripeWebhook(rawBody, signature) {
        const event = this.stripeService.verifyWebhookSignature(rawBody, signature);
        await this.prisma.webhookLog.create({
            data: {
                gateway: 'STRIPE',
                eventType: event?.type || 'unknown',
                payload: event || { raw: 'verification_failed' },
                signature,
                processed: !!event,
                error: event ? null : 'Invalid signature',
            },
        });
        if (!event) {
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
        try {
            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data.object;
                    if (session.payment_status === 'paid') {
                        await this.confirmPaymentByGatewayOrder('STRIPE', session.id, session.payment_intent, 'card');
                    }
                    break;
                }
                case 'payment_intent.payment_failed': {
                    const intent = event.data.object;
                    const payment = await this.prisma.payment.findFirst({
                        where: { gatewayPaymentId: intent.id },
                    });
                    if (payment) {
                        await this.failPaymentByGatewayOrder(payment.gatewayOrderId || '');
                    }
                    break;
                }
                case 'charge.refunded': {
                    const charge = event.data.object;
                    if (charge.refunds?.data?.length) {
                        const refund = charge.refunds.data[0];
                        await this.handleGatewayRefundUpdate(refund.id, 'COMPLETED');
                    }
                    break;
                }
            }
        }
        catch (err) {
            this.logger.error(`Stripe webhook processing error: ${err.message}`);
        }
        return { received: true };
    }
    async confirmPaymentByGatewayOrder(gateway, gatewayOrderId, gatewayPaymentId, method) {
        const payment = await this.prisma.payment.findFirst({
            where: { gatewayOrderId },
        });
        if (payment && payment.status !== 'COMPLETED') {
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'COMPLETED',
                    gatewayPaymentId,
                    method: method || payment.method,
                    paidAt: new Date(),
                },
            });
            await this.prisma.transaction.updateMany({
                where: { paymentId: payment.id, type: 'CHARGE' },
                data: { status: 'COMPLETED', gatewayRef: gatewayPaymentId },
            });
            await this.prisma.order.update({
                where: { id: payment.orderId },
                data: { paymentId: gatewayPaymentId, status: 'CONFIRMED' },
            });
        }
        else if (!payment) {
            if (gateway === 'RAZORPAY') {
                await this.prisma.order.updateMany({
                    where: { razorpayOrderId: gatewayOrderId },
                    data: { paymentId: gatewayPaymentId, status: 'CONFIRMED' },
                });
            }
        }
    }
    async failPaymentByGatewayOrder(gatewayOrderId) {
        const payment = await this.prisma.payment.findFirst({
            where: { gatewayOrderId },
        });
        if (payment) {
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: { status: 'FAILED' },
            });
            await this.prisma.transaction.updateMany({
                where: { paymentId: payment.id, type: 'CHARGE' },
                data: { status: 'FAILED' },
            });
        }
    }
    async handleGatewayRefundUpdate(gatewayRefundId, status) {
        await this.prisma.refund.updateMany({
            where: { gatewayRefundId },
            data: {
                status: status,
                processedAt: status === 'COMPLETED' ? new Date() : undefined,
            },
        });
    }
    async processRefund(paymentId, amount, reason) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { refunds: true },
        });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        if (payment.status !== 'COMPLETED') {
            throw new common_1.BadRequestException('Can only refund completed payments');
        }
        if (!payment.gatewayPaymentId) {
            throw new common_1.BadRequestException('No gateway payment ID found — cannot refund');
        }
        const alreadyRefunded = payment.refunds
            .filter((r) => r.status === 'COMPLETED' || r.status === 'PROCESSING')
            .reduce((sum, r) => sum + r.amount, 0);
        const refundAmount = amount || (payment.amount - alreadyRefunded);
        if (refundAmount <= 0)
            throw new common_1.BadRequestException('Nothing to refund');
        if (refundAmount > payment.amount - alreadyRefunded) {
            throw new common_1.BadRequestException(`Maximum refundable amount is ₹${(payment.amount - alreadyRefunded).toFixed(2)}`);
        }
        const gateway = payment.gateway === 'RAZORPAY' ? this.razorpayService : this.stripeService;
        const result = await gateway.processRefund(payment.gatewayPaymentId, refundAmount);
        const refund = await this.prisma.refund.create({
            data: {
                paymentId: payment.id,
                amount: refundAmount,
                reason: reason || 'Customer request',
                status: result.status === 'processed' || result.status === 'succeeded' ? 'COMPLETED' : 'PROCESSING',
                gatewayRefundId: result.gatewayRefundId,
                processedAt: result.status === 'processed' || result.status === 'succeeded' ? new Date() : null,
            },
        });
        await this.prisma.transaction.create({
            data: {
                paymentId: payment.id,
                type: 'REFUND',
                amount: refundAmount,
                currency: payment.currency,
                status: refund.status,
                gatewayRef: result.gatewayRefundId,
            },
        });
        const totalRefunded = alreadyRefunded + refundAmount;
        const isFullRefund = totalRefunded >= payment.amount;
        await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
            },
        });
        if (isFullRefund) {
            await this.prisma.order.update({
                where: { id: payment.orderId },
                data: { status: 'REFUNDED' },
            });
        }
        return refund;
    }
    async retryPayment(orderId, gateway) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { address: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.status !== 'PENDING') {
            throw new common_1.BadRequestException('Can only retry payments for pending orders');
        }
        await this.prisma.payment.updateMany({
            where: { orderId, status: 'PENDING' },
            data: { status: 'CANCELLED' },
        });
        const country = order.address?.country || 'India';
        return this.createPaymentOrder(orderId, gateway, country);
    }
    async getPaymentStatus(paymentId) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                transactions: { orderBy: { createdAt: 'desc' } },
                refunds: { orderBy: { createdAt: 'desc' } },
                order: { select: { orderNumber: true, status: true } },
            },
        });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        return payment;
    }
    async getOrderPayments(orderId) {
        return this.prisma.payment.findMany({
            where: { orderId },
            include: {
                transactions: { orderBy: { createdAt: 'desc' } },
                refunds: { orderBy: { createdAt: 'desc' } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getPaymentStats() {
        const [totalPayments, completedPayments, failedPayments, pendingPayments, totalCollected, totalRefunded, byGateway, recentTransactions, recentWebhooks,] = await Promise.all([
            this.prisma.payment.count(),
            this.prisma.payment.count({ where: { status: 'COMPLETED' } }),
            this.prisma.payment.count({ where: { status: 'FAILED' } }),
            this.prisma.payment.count({ where: { status: 'PENDING' } }),
            this.prisma.payment.aggregate({
                _sum: { amount: true },
                where: { status: 'COMPLETED' },
            }),
            this.prisma.refund.aggregate({
                _sum: { amount: true },
                where: { status: 'COMPLETED' },
            }),
            this.prisma.payment.groupBy({
                by: ['gateway'],
                _count: { gateway: true },
                _sum: { amount: true },
                where: { status: 'COMPLETED' },
            }),
            this.prisma.transaction.findMany({
                take: 20,
                orderBy: { createdAt: 'desc' },
                include: {
                    payment: {
                        select: {
                            gateway: true,
                            order: { select: { orderNumber: true } },
                        },
                    },
                },
            }),
            this.prisma.webhookLog.findMany({
                take: 20,
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        const successRate = totalPayments > 0
            ? Math.round((completedPayments / totalPayments) * 100)
            : 0;
        return {
            totalPayments,
            completedPayments,
            failedPayments,
            pendingPayments,
            totalCollected: totalCollected._sum.amount || 0,
            totalRefunded: totalRefunded._sum.amount || 0,
            successRate,
            byGateway,
            recentTransactions,
            recentWebhooks,
        };
    }
    async getAdminPayments(page = 1, limit = 20, status, gateway) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (gateway)
            where.gateway = gateway;
        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                include: {
                    order: {
                        select: {
                            orderNumber: true,
                            user: { select: { name: true, email: true } },
                        },
                    },
                    refunds: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.payment.count({ where }),
        ]);
        return { payments, total, page, pages: Math.ceil(total / limit) };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        razorpay_service_1.RazorpayService,
        stripe_service_1.StripeService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map