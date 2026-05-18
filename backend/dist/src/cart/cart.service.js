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
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CartService = class CartService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCart(authId) {
        const user = await this.prisma.user.findUnique({ where: { authId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const items = await this.prisma.cartItem.findMany({
            where: { userId: user.id },
            include: { product: { select: { id: true, name: true, slug: true, price: true, comparePrice: true, images: true, stock: true } } },
            orderBy: { createdAt: 'desc' },
        });
        const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        return { items, total, count: items.length };
    }
    async addToCart(authId, dto) {
        const user = await this.prisma.user.findUnique({ where: { authId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const existing = await this.prisma.cartItem.findFirst({
            where: { userId: user.id, productId: dto.productId, size: dto.size || null, color: dto.color || null },
        });
        if (existing) {
            return this.prisma.cartItem.update({
                where: { id: existing.id },
                data: { quantity: existing.quantity + dto.quantity },
                include: { product: true },
            });
        }
        return this.prisma.cartItem.create({
            data: { userId: user.id, ...dto },
            include: { product: true },
        });
    }
    async updateItem(itemId, dto) {
        return this.prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity: dto.quantity },
            include: { product: true },
        });
    }
    async removeItem(itemId) {
        return this.prisma.cartItem.delete({ where: { id: itemId } });
    }
    async clearCart(authId) {
        const user = await this.prisma.user.findUnique({ where: { authId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        await this.prisma.cartItem.deleteMany({ where: { userId: user.id } });
        return { message: 'Cart cleared' };
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CartService);
//# sourceMappingURL=cart.service.js.map