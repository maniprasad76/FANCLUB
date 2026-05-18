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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const payments_service_1 = require("../payments/payments.service");
const uuid_1 = require("uuid");
const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_COST = 99;
let OrdersService = class OrdersService {
    prisma;
    paymentsService;
    constructor(prisma, paymentsService) {
        this.prisma = prisma;
        this.paymentsService = paymentsService;
    }
    async create(authId, dto) {
        const user = await this.prisma.user.findUnique({ where: { authId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (!dto.items || dto.items.length === 0) {
            throw new common_1.BadRequestException('Order must contain at least one item');
        }
        const productIds = dto.items.map((item) => item.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds }, isActive: true },
        });
        const productMap = new Map(products.map((p) => [p.id, p]));
        for (const item of dto.items) {
            const product = productMap.get(item.productId);
            if (!product) {
                throw new common_1.BadRequestException(`Product ${item.productId} not found or inactive`);
            }
            if (product.stock < item.quantity) {
                throw new common_1.BadRequestException(`Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`);
            }
        }
        const subtotal = dto.items.reduce((sum, item) => {
            const product = productMap.get(item.productId);
            return sum + product.price * item.quantity;
        }, 0);
        const shippingAmount = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
        const totalAmount = subtotal + shippingAmount;
        const orderNumber = `TFI-${Date.now().toString(36).toUpperCase()}-${(0, uuid_1.v4)().slice(0, 4).toUpperCase()}`;
        let customerCountry = dto.country || 'India';
        if (dto.addressId) {
            const address = await this.prisma.address.findUnique({ where: { id: dto.addressId } });
            if (address)
                customerCountry = address.country || 'India';
        }
        const order = await this.prisma.$transaction(async (tx) => {
            const created = await tx.order.create({
                data: {
                    orderNumber,
                    userId: user.id,
                    totalAmount,
                    shippingAmount,
                    addressId: dto.addressId,
                    paymentMethod: dto.paymentMethod || 'COD',
                    status: dto.paymentMethod === 'ONLINE' ? 'PENDING' : 'CONFIRMED',
                    notes: dto.notes,
                    items: {
                        create: dto.items.map((item) => {
                            const product = productMap.get(item.productId);
                            return {
                                productId: item.productId,
                                quantity: item.quantity,
                                size: item.size,
                                color: item.color,
                                price: product.price,
                                name: product.name,
                                image: product.images?.[0],
                            };
                        }),
                    },
                },
                include: { items: { include: { product: true } }, address: true },
            });
            await tx.cartItem.deleteMany({ where: { userId: user.id } });
            for (const item of dto.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });
            }
            return created;
        });
        if (dto.paymentMethod === 'ONLINE') {
            const paymentResult = await this.paymentsService.createPaymentOrder(order.id, dto.gateway, customerCountry, dto.currency || 'INR');
            return {
                ...order,
                payment: paymentResult,
                razorpayOrderId: paymentResult.razorpayOrderId || undefined,
                razorpayKey: paymentResult.razorpayKey || undefined,
                stripeSessionId: paymentResult.stripeSessionId || undefined,
                checkoutUrl: paymentResult.checkoutUrl || undefined,
                gateway: paymentResult.gateway,
                totalAmount,
            };
        }
        return order;
    }
    async findUserOrders(authId, page = 1, limit = 10) {
        const user = await this.prisma.user.findUnique({ where: { authId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where: { userId: user.id },
                include: { items: true, payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.order.count({ where: { userId: user.id } }),
        ]);
        return { orders, total, page, pages: Math.ceil(total / limit) };
    }
    async findById(id) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                items: { include: { product: true } },
                address: true,
                user: { select: { id: true, name: true, email: true } },
                payments: {
                    include: { refunds: true },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return order;
    }
    async updateStatus(id, dto) {
        return this.prisma.order.update({
            where: { id },
            data: { status: dto.status, trackingId: dto.trackingId },
            include: { items: true },
        });
    }
    async adminFindAll(page = 1, limit = 20, status) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    items: true,
                    payments: { orderBy: { createdAt: 'desc' }, take: 1 },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.order.count({ where }),
        ]);
        return { orders, total, page, pages: Math.ceil(total / limit) };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        payments_service_1.PaymentsService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map