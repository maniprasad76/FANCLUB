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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReviewsService = class ReviewsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(authId, productId, rating, comment) {
        const user = await this.prisma.user.findUnique({ where: { authId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const review = await this.prisma.review.upsert({
            where: { userId_productId: { userId: user.id, productId } },
            update: { rating, comment },
            create: { userId: user.id, productId, rating, comment },
        });
        const agg = await this.prisma.review.aggregate({
            where: { productId },
            _avg: { rating: true },
            _count: { rating: true },
        });
        await this.prisma.product.update({
            where: { id: productId },
            data: { rating: agg._avg.rating || 0, reviewCount: agg._count.rating },
        });
        return review;
    }
    async findByProduct(productId) {
        return this.prisma.review.findMany({
            where: { productId },
            include: { user: { select: { id: true, name: true, avatar: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async adminFindAll(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    product: { select: { id: true, name: true, slug: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.review.count(),
        ]);
        return { reviews, total, page, pages: Math.ceil(total / limit) };
    }
    async delete(id) {
        const review = await this.prisma.review.findUnique({ where: { id } });
        if (!review)
            throw new common_1.NotFoundException('Review not found');
        await this.prisma.review.delete({ where: { id } });
        const agg = await this.prisma.review.aggregate({
            where: { productId: review.productId },
            _avg: { rating: true },
            _count: { rating: true },
        });
        await this.prisma.product.update({
            where: { id: review.productId },
            data: { rating: agg._avg.rating || 0, reviewCount: agg._count.rating },
        });
        return { message: 'Review deleted' };
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map