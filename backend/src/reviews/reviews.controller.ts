import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}


  @Get('product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  /** 5 reviews per minute — abuse protection */

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser('authId') authId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(
      authId,
      dto.productId,
      dto.rating,
      dto.comment,
    );
  }


  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  adminFindAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.reviewsService.adminFindAll(+page, +limit);
  }


  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.reviewsService.delete(id);
  }
}
