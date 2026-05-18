"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RazorpayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RazorpayService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
let RazorpayService = RazorpayService_1 = class RazorpayService {
    configService;
    logger = new common_1.Logger(RazorpayService_1.name);
    razorpay;
    keyId;
    keySecret;
    webhookSecret;
    constructor(configService) {
        this.configService = configService;
        this.keyId = this.configService.get('RAZORPAY_KEY_ID') || '';
        this.keySecret = this.configService.get('RAZORPAY_KEY_SECRET') || '';
        this.webhookSecret = this.configService.get('RAZORPAY_WEBHOOK_SECRET') || this.keySecret;
        if (this.keyId && this.keySecret && !this.keyId.startsWith('your-')) {
            try {
                const Razorpay = require('razorpay');
                this.razorpay = new Razorpay({
                    key_id: this.keyId,
                    key_secret: this.keySecret,
                });
                this.logger.log('✅ Razorpay SDK initialized');
            }
            catch {
                this.logger.warn('⚠️ Razorpay SDK not found. Indian payments disabled.');
            }
        }
        else {
            this.logger.warn('⚠️ Razorpay keys not configured. Indian payments will be stubbed.');
        }
    }
    getPublishableKey() {
        return this.keyId;
    }
    isAvailable() {
        return !!this.razorpay;
    }
    async createOrder(amount, currency, metadata) {
        if (!this.razorpay) {
            return {
                gatewayOrderId: `order_stub_${Date.now()}`,
                amount,
                currency,
                status: 'created',
                metadata: { key: this.keyId },
            };
        }
        const order = await this.razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency,
            receipt: metadata.receipt || `tfi_${Date.now()}`,
            notes: metadata.notes || {},
        });
        return {
            gatewayOrderId: order.id,
            amount: order.amount / 100,
            currency: order.currency,
            status: order.status,
            metadata: { key: this.keyId },
        };
    }
    async verifyPayment(data) {
        const { razorpayOrderId, razorpayPaymentId, signature } = data;
        if (!this.keySecret || this.keySecret.startsWith('your-')) {
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
    async processRefund(gatewayPaymentId, amount) {
        if (!this.razorpay) {
            return {
                gatewayRefundId: `refund_stub_${Date.now()}`,
                amount,
                status: 'processed',
            };
        }
        const refund = await this.razorpay.payments.refund(gatewayPaymentId, {
            amount: Math.round(amount * 100),
            speed: 'normal',
        });
        return {
            gatewayRefundId: refund.id,
            amount: refund.amount / 100,
            status: refund.status,
        };
    }
    async getPaymentDetails(gatewayPaymentId) {
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
    verifyWebhookSignature(rawBody, signature) {
        if (!this.webhookSecret || this.webhookSecret.startsWith('your-')) {
            return true;
        }
        const expectedSignature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(rawBody)
            .digest('hex');
        return expectedSignature === signature;
    }
};
exports.RazorpayService = RazorpayService;
exports.RazorpayService = RazorpayService = RazorpayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RazorpayService);
//# sourceMappingURL=razorpay.service.js.map