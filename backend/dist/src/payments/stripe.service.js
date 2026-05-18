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
var StripeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let StripeService = StripeService_1 = class StripeService {
    configService;
    logger = new common_1.Logger(StripeService_1.name);
    stripe = null;
    publishableKey;
    webhookSecret;
    constructor(configService) {
        this.configService = configService;
        const secretKey = this.configService.get('STRIPE_SECRET_KEY') || '';
        this.publishableKey = this.configService.get('STRIPE_PUBLISHABLE_KEY') || '';
        this.webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET') || '';
        if (secretKey && !secretKey.startsWith('sk_test_your_')) {
            try {
                const Stripe = require('stripe');
                this.stripe = new Stripe(secretKey);
                this.logger.log('✅ Stripe SDK initialized');
            }
            catch (err) {
                this.logger.warn(`⚠️ Stripe initialization failed: ${err.message}`);
            }
        }
        else {
            this.logger.warn('⚠️ Stripe keys not configured. International payments will be stubbed.');
        }
    }
    getPublishableKey() {
        return this.publishableKey;
    }
    isAvailable() {
        return !!this.stripe;
    }
    async createOrder(amount, currency, metadata) {
        if (!this.stripe) {
            return {
                gatewayOrderId: `cs_stub_${Date.now()}`,
                amount,
                currency,
                status: 'open',
                metadata: {
                    checkoutUrl: metadata.successUrl || 'http://localhost:5173/order-success',
                    publishableKey: this.publishableKey,
                },
            };
        }
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
        const sessionParams = {
            payment_method_types: ['card'],
            mode: 'payment',
            currency: currency.toLowerCase(),
            line_items: [
                {
                    price_data: {
                        currency: currency.toLowerCase(),
                        product_data: {
                            name: metadata.orderDescription || 'TFI Order',
                            description: metadata.orderNumber ? `Order #${metadata.orderNumber}` : undefined,
                        },
                        unit_amount: Math.round(amount * 100),
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
    async verifyPayment(data) {
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
    async processRefund(gatewayPaymentId, amount) {
        if (!this.stripe) {
            return {
                gatewayRefundId: `re_stub_${Date.now()}`,
                amount,
                status: 'succeeded',
            };
        }
        const refund = await this.stripe.refunds.create({
            payment_intent: gatewayPaymentId,
            amount: Math.round(amount * 100),
        });
        return {
            gatewayRefundId: refund.id,
            amount: refund.amount ? refund.amount / 100 : amount,
            status: refund.status || 'pending',
        };
    }
    async getPaymentDetails(gatewayPaymentId) {
        if (!this.stripe) {
            return {
                gatewayPaymentId,
                amount: 0,
                currency: 'INR',
                status: 'stub',
            };
        }
        const paymentIntent = await this.stripe.paymentIntents.retrieve(gatewayPaymentId);
        return {
            gatewayPaymentId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency.toUpperCase(),
            status: paymentIntent.status,
            method: 'card',
            metadata: paymentIntent.metadata,
        };
    }
    verifyWebhookSignature(rawBody, signature) {
        if (!this.stripe || !this.webhookSecret || this.webhookSecret.startsWith('whsec_your_')) {
            try {
                return JSON.parse(typeof rawBody === 'string' ? rawBody : rawBody.toString());
            }
            catch {
                return null;
            }
        }
        try {
            return this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
        }
        catch (err) {
            this.logger.error(`Stripe webhook verification failed: ${err.message}`);
            return null;
        }
    }
};
exports.StripeService = StripeService;
exports.StripeService = StripeService = StripeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StripeService);
//# sourceMappingURL=stripe.service.js.map