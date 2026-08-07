import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Headers,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserProfile } from '../auth/auth.types';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser('authId') authId: string,
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.ordersService.create(authId, dto, idempotencyKey);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  findMyOrders(
    @CurrentUser('authId') authId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.ordersService.findUserOrders(authId, +page, +limit);
  }

  @SkipThrottle()
  @Get('public/recent')
  findPublicRecentPurchases() {
    return this.ordersService.getPublicRecentPurchases();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserProfile,
  ) {
    return this.ordersService.findById(id, user);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  adminFindAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.ordersService.adminFindAll(+page, +limit, status, search);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}
