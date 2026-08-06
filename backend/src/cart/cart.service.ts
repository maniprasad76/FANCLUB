import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(authId: string) {
    const user = await this.prisma.user.findUnique({ where: { authId } });
    if (!user) throw new NotFoundException('User not found');

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

    const total = items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );
    return { items, total, count: items.length };
  }

  async addToCart(authId: string, dto: AddToCartDto) {
    const user = await this.prisma.user.findUnique({ where: { authId } });
    if (!user) throw new NotFoundException('User not found');

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
  async updateItem(itemId: string, userId: string, dto: UpdateCartItemDto) {
    // First verify ownership
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId },
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
  async removeItem(itemId: string, userId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    return this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  async clearCart(authId: string) {
    const user = await this.prisma.user.findUnique({ where: { authId } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.cartItem.deleteMany({ where: { userId: user.id } });
    return { message: 'Cart cleared' };
  }
}
