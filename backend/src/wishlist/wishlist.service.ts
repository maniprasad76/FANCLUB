import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async getWishlist(authId: string) {
    const user = await this.prisma.user.findUnique({ where: { authId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.wishlist.findMany({
      where: { userId: user.id },
      include: { product: { include: { category: { select: { id: true, name: true, slug: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggle(authId: string, productId: string) {
    const user = await this.prisma.user.findUnique({ where: { authId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });

    if (existing) {
      await this.prisma.wishlist.delete({ where: { id: existing.id } });
      return { added: false, message: 'Removed from wishlist' };
    }

    await this.prisma.wishlist.create({ data: { userId: user.id, productId } });
    return { added: true, message: 'Added to wishlist' };
  }

  async remove(authId: string, productId: string) {
    const user = await this.prisma.user.findUnique({ where: { authId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.wishlist.delete({
      where: { userId_productId: { userId: user.id, productId } },
    });
    return { message: 'Removed from wishlist' };
  }
}
