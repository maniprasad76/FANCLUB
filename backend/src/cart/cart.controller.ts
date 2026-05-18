import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  getCart(@CurrentUser('authId') authId: string) {
    return this.cartService.getCart(authId);
  }

  @Post()
  addToCart(@CurrentUser('authId') authId: string, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(authId, dto);
  }

  @Put(':itemId')
  updateItem(@Param('itemId') itemId: string, @Body() dto: UpdateCartItemDto) {
    return this.cartService.updateItem(itemId, dto);
  }

  @Delete(':itemId')
  removeItem(@Param('itemId') itemId: string) {
    return this.cartService.removeItem(itemId);
  }

  @Delete()
  clearCart(@CurrentUser('authId') authId: string) {
    return this.cartService.clearCart(authId);
  }
}
