import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
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

  async getCart(userIdentifier: string) {
    const user = await this.resolveUser(userIdentifier);

    const items = await this.prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            comparePrice: true,
            images: true,
            stock: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Safely filter out any orphaned cart items where product was removed
    const validItems = items.filter((item) => item.product != null);
    const total = validItems.reduce(
      (sum, item) => sum + Number(item.product?.price || 0) * item.quantity,
      0,
    );
    return { items: validItems, total, count: validItems.length };
  }

  async addToCart(userIdentifier: string, dto: AddToCartDto) {
    const user = await this.resolveUser(userIdentifier);

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.prisma.cartItem.findFirst({
      where: {
        userId: user.id,
        productId: dto.productId,
        size: dto.size || null,
        color: dto.color || null,
      },
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

  /**
   * Update a cart item quantity.
   * SECURITY: userId is passed from the authenticated session and included
   * in the WHERE clause — users can only update their own cart items.
   */
  async updateItem(itemId: string, userIdentifier: string, dto: UpdateCartItemDto) {
    const user = await this.resolveUser(userIdentifier);

    // First verify ownership
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId: user.id },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
      include: { product: true },
    });
  }

  /**
   * Remove a cart item.
   * SECURITY: userId is passed from the authenticated session — users can
   * only remove their own cart items.
   */
  async removeItem(itemId: string, userIdentifier: string) {
    const user = await this.resolveUser(userIdentifier);

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId: user.id },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    return this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  async clearCart(userIdentifier: string) {
    const user = await this.resolveUser(userIdentifier);
    await this.prisma.cartItem.deleteMany({ where: { userId: user.id } });
    return { message: 'Cart cleared' };
  }
}
