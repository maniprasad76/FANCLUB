import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { ClaimRewardDto, AdminUpdateProgressDto } from './dto/loyalty.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  // ── User Endpoints ──

  @UseGuards(JwtAuthGuard)
  @Get('progress')
  getProgress(@CurrentUser('id') userId: string) {
    return this.loyaltyService.getProgress(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('eligible-products')
  getEligibleProducts() {
    return this.loyaltyService.getEligibleProducts();
  }

  @UseGuards(JwtAuthGuard)
  @Post('claim')
  claimReward(@CurrentUser('id') userId: string, @Body() dto: ClaimRewardDto) {
    return this.loyaltyService.claimReward(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  getRewardHistory(@CurrentUser('id') userId: string) {
    return this.loyaltyService.getRewardHistory(userId);
  }

  // ── Admin Endpoints ──

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/progress')
  adminGetAllProgress(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.loyaltyService.adminGetAllProgress(+page, +limit, search);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('admin/progress/:userId')
  adminUpdateProgress(
    @Param('userId') userId: string,
    @Body() dto: AdminUpdateProgressDto,
  ) {
    return this.loyaltyService.adminUpdateProgress(userId, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/reset/:userId')
  adminResetCycle(@Param('userId') userId: string) {
    return this.loyaltyService.adminResetCycle(userId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/analytics')
  adminGetAnalytics() {
    return this.loyaltyService.adminGetAnalytics();
  }
}
