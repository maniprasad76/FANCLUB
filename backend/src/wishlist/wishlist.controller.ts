import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  @Get()
  getWishlist(@CurrentUser('authId') authId: string) {
    return this.wishlistService.getWishlist(authId);
  }

  @Post(':productId')
  toggle(@CurrentUser('authId') authId: string, @Param('productId') productId: string) {
    return this.wishlistService.toggle(authId, productId);
  }

  @Delete(':productId')
  remove(@CurrentUser('authId') authId: string, @Param('productId') productId: string) {
    return this.wishlistService.remove(authId, productId);
  }
}
