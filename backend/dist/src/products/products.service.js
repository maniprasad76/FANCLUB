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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const page = query.page || 1;
        const limit = query.limit || 12;
        const skip = (page - 1) * limit;
        const where = { isActive: true };
        if (query.category) {
            where.category = { slug: query.category };
        }
        if (query.gender) {
            where.gender = query.gender;
        }
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
                { tags: { hasSome: [query.search] } },
            ];
        }
        if (query.minPrice || query.maxPrice) {
            where.price = {};
            if (query.minPrice)
                where.price.gte = query.minPrice;
            if (query.maxPrice)
                where.price.lte = query.maxPrice;
        }
        if (query.size)
            where.sizes = { has: query.size };
        if (query.color)
            where.colors = { has: query.color };
        if (query.featured !== undefined)
            where.featured = query.featured;
        if (query.bestseller !== undefined)
            where.bestseller = query.bestseller;
        if (query.newArrival !== undefined)
            where.newArrival = query.newArrival;
        let orderBy = { createdAt: 'desc' };
        if (query.sort === 'price_asc')
            orderBy = { price: 'asc' };
        else if (query.sort === 'price_desc')
            orderBy = { price: 'desc' };
        else if (query.sort === 'name')
            orderBy = { name: 'asc' };
        else if (query.sort === 'rating')
            orderBy = { rating: 'desc' };
        else if (query.sort === 'newest')
            orderBy = { createdAt: 'desc' };
        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                include: { category: { select: { id: true, name: true, slug: true } } },
                orderBy,
                skip,
                take: limit,
            }),
            this.prisma.product.count({ where }),
        ]);
        return { products, total, page, pages: Math.ceil(total / limit) };
    }
    async findBySlug(slug) {
        const product = await this.prisma.product.findUnique({
            where: { slug },
            include: {
                category: true,
                reviews: { include: { user: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'desc' }, take: 10 },
            },
        });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        return product;
    }
    async findById(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: { category: true },
        });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        return product;
    }
    async getFeatured() {
        return this.prisma.product.findMany({
            where: { featured: true, isActive: true },
            include: { category: { select: { id: true, name: true, slug: true } } },
            take: 8,
        });
    }
    async getBestsellers() {
        return this.prisma.product.findMany({
            where: { bestseller: true, isActive: true },
            include: { category: { select: { id: true, name: true, slug: true } } },
            take: 8,
        });
    }
    async getNewArrivals() {
        return this.prisma.product.findMany({
            where: { newArrival: true, isActive: true },
            include: { category: { select: { id: true, name: true, slug: true } } },
            take: 8,
        });
    }
    async getRelated(slug) {
        const product = await this.prisma.product.findUnique({ where: { slug } });
        if (!product)
            return [];
        return this.prisma.product.findMany({
            where: { categoryId: product.categoryId, slug: { not: slug }, isActive: true },
            take: 4,
        });
    }
    async create(dto) {
        return this.prisma.product.create({ data: dto });
    }
    async update(id, dto) {
        return this.prisma.product.update({ where: { id }, data: dto });
    }
    async delete(id) {
        return this.prisma.product.delete({ where: { id } });
    }
    async adminFindAll(page = 1, limit = 20, search) {
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                include: { category: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.product.count({ where }),
        ]);
        return { products, total, page, pages: Math.ceil(total / limit) };
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map