import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PaymentsModule } from '../payments/payments.module';
import { CouponsModule } from '../coupons/coupons.module.js';
import { LoyaltyModule } from '../loyalty/loyalty.module.js';
import { OrderNotificationHelper } from '../common/services/order-notification.helper';

@Module({
  imports: [ConfigModule, PaymentsModule, CouponsModule, LoyaltyModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderNotificationHelper],
  exports: [OrdersService],
})
export class OrdersModule {}
