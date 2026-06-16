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
  create(@CurrentUser('authId') authId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(authId, dto);
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

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: UserProfile) {
    return this.ordersService.findById(id, user);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  adminFindAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    return this.ordersService.adminFindAll(+page, +limit, status);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}
