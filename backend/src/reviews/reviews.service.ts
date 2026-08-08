import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(
    authId: string,
    productId: string,
    rating: number,
    comment?: string,
    photos?: string[],
  ) {
    const user = await this.prisma.user.findUnique({ where: { authId } });
    if (!user) throw new NotFoundException('User not found');

    const safePhotos = Array.isArray(photos) ? photos.slice(0, 3) : [];

    const review = await this.prisma.review.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      update: { rating, comment, photos: safePhotos },
      create: { userId: user.id, productId, rating, comment, photos: safePhotos },
    });

    // Recalculate product rating
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

  /**
   * Reviews for a product, each annotated with a `verified` flag.
   *
   * A review is considered verified when the reviewer has a DELIVERED order
   * containing this product — computed entirely from existing order data
   * (no extra schema needed). Any user can leave a review, but only
   * confirmed purchasers get the verified badge.
   */
  async findByProduct(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const verifiedUserIds = await this.findVerifiedBuyers(productId, reviews);

    return reviews.map((r) => ({
      ...r,
      verified: verifiedUserIds.has(r.userId),
    }));
  }

  /** User IDs with a DELIVERED order containing `productId`. */
  private async findVerifiedBuyers(
    productId: string,
    reviews: { userId: string }[],
  ): Promise<Set<string>> {
    const userIds = [...new Set(reviews.map((r) => r.userId))];
    if (userIds.length === 0) return new Set();

    const hits = await this.prisma.orderItem.findMany({
      where: {
        productId,
        order: {
          status: 'DELIVERED',
          userId: { in: userIds },
        },
      },
      select: { order: { select: { userId: true } } },
    });

    return new Set(hits.map((h) => h.order.userId));
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

  async delete(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
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

  /**
   * Delete a review owned by the authenticated user.
   * SECURITY: userId is derived from the JWT — users can only delete their own reviews.
   * Returns 404 (not 403) if the review doesn't belong to the user to prevent enumeration.
   */
  async deleteByOwner(id: string, userId: string) {
    const review = await this.prisma.review.findFirst({
      where: { id, userId },
    });
    if (!review) throw new NotFoundException('Review not found');

    await this.prisma.review.delete({ where: { id } });

    // Recalculate product rating
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
}
