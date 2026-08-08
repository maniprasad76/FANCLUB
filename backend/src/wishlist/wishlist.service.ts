import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  private async resolveUser(userIdentifier?: string) {
    if (!userIdentifier) {
      throw new UnauthorizedException('Authentication required');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: userIdentifier }, { authId: userIdentifier }],
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getWishlist(userIdentifier: string) {
    const user = await this.resolveUser(userIdentifier);

    const items = await this.prisma.wishlist.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.filter((item) => item.product != null);
  }

  async toggle(userIdentifier: string, productId: string) {
    const user = await this.resolveUser(userIdentifier);

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

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

  async remove(userIdentifier: string, productId: string) {
    const user = await this.resolveUser(userIdentifier);

    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });
    if (!existing) throw new NotFoundException('Wishlist item not found');

    await this.prisma.wishlist.delete({
      where: { userId_productId: { userId: user.id, productId } },
    });
    return { message: 'Removed from wishlist' };
  }
}
