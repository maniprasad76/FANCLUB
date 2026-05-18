import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { RazorpayService } from './razorpay.service';
import { StripeService } from './stripe.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, RazorpayService, StripeService],
  exports: [PaymentsService, RazorpayService, StripeService],
})
export class PaymentsModule {}
