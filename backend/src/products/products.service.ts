import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from './dto/products.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = { isActive: true };

    if (query.category) {
      where.category = { slug: query.category };
    }
    if (query.gender) {
      where.gender = query.gender as any;
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
      if (query.minPrice) where.price.gte = query.minPrice;
      if (query.maxPrice) where.price.lte = query.maxPrice;
    }
    if (query.size) where.sizes = { has: query.size };
    if (query.color) where.colors = { has: query.color };
    if (query.featured !== undefined) where.featured = query.featured;
    if (query.bestseller !== undefined) where.bestseller = query.bestseller;
    if (query.newArrival !== undefined) where.newArrival = query.newArrival;

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sort === 'price_asc') orderBy = { price: 'asc' };
    else if (query.sort === 'price_desc') orderBy = { price: 'desc' };
    else if (query.sort === 'name') orderBy = { name: 'asc' };
    else if (query.sort === 'rating') orderBy = { rating: 'desc' };
    else if (query.sort === 'newest') orderBy = { createdAt: 'desc' };

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

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        reviews: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Product not found');
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

  async getRelated(slug: string) {
    const product = await this.prisma.product.findUnique({ where: { slug } });
    if (!product) return [];
    return this.prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        slug: { not: slug },
        isActive: true,
      },
      take: 4,
    });
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  async update(id: string, dto: UpdateProductDto) {
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }

  async bulkDelete(ids: string[]) {
    return this.prisma.product.deleteMany({ where: { id: { in: ids } } });
  }

  // Admin: all products including inactive
  async adminFindAll(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = {};
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
}
