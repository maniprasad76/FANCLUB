import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@SkipThrottle()
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

  /**
   * SECURITY: passes the authenticated user's DB id to the service so the
   * ownership check in updateItem can verify the item belongs to this user.
   */
  @Put(':itemId')
  updateItem(
    @Param('itemId') itemId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(itemId, userId, dto);
  }

  /**
   * SECURITY: same ownership check as updateItem.
   */
  @Delete(':itemId')
  removeItem(
    @Param('itemId') itemId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.cartService.removeItem(itemId, userId);
  }

  @Delete()
  clearCart(@CurrentUser('authId') authId: string) {
    return this.cartService.clearCart(authId);
  }
}
