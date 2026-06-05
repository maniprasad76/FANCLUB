import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  Headers,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreatePaymentDto,
  VerifyRazorpayDto,
  RefundDto,
  RetryPaymentDto,
} from './dto/payment.dto';

/**
 * PaymentsController — API endpoints for payment operations.
 *
 * Public endpoints (no auth):
 *   POST /payments/webhook/razorpay — Razorpay server-to-server callback
 *
 * Authenticated endpoints:
 *   POST /payments/create-order     — Create a payment order for checkout
 *   POST /payments/verify           — Verify Razorpay payment callback
 *   POST /payments/retry/:orderId   — Retry a failed payment
 *   GET  /payments/:paymentId/status — Get payment status
 *   GET  /payments/order/:orderId   — Get all payments for an order
 *
 * Admin endpoints:
 *   POST /payments/refund/:paymentId — Initiate refund
 *   GET  /payments/admin/stats       — Payment analytics
 *   GET  /payments/admin/list        — Paginated payment list
 */
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // ─────────────────────────────────────────────────────────
  // CUSTOMER-FACING ENDPOINTS
  // ─────────────────────────────────────────────────────────

  /**
   * Create a payment order — called from checkout page.
   */
  @UseGuards(JwtAuthGuard)
  @Post('create-order')
  createOrder(@Body() dto: CreatePaymentDto, @CurrentUser() user: any) {
    return this.paymentsService.createPaymentOrder(
      dto.orderId,
      dto.gateway,
      dto.country,
      dto.currency || 'INR',
      user,
    );
  }

  /**
   * Verify a Razorpay payment callback (frontend → backend).
   * Never trust frontend payment success — this verifies the HMAC signature.
   */
  @UseGuards(JwtAuthGuard)
  @Post('verify')
  verifyRazorpay(@Body() dto: VerifyRazorpayDto, @CurrentUser() user: any) {
    return this.paymentsService.verifyRazorpayPayment(
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.signature,
      user,
    );
  }



  /**
   * Retry a failed/pending payment with a new attempt.
   */
  @UseGuards(JwtAuthGuard)
  @Post('retry/:orderId')
  retryPayment(
    @Param('orderId') orderId: string,
    @Body() dto: RetryPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.retryPayment(orderId, dto.gateway, user);
  }

  /**
   * Get the status of a specific payment.
   */
  @UseGuards(JwtAuthGuard)
  @Get(':paymentId/status')
  getPaymentStatus(
    @Param('paymentId') paymentId: string,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.getPaymentStatus(paymentId, user);
  }

  /**
   * Get all payments for a specific order.
   */
  @UseGuards(JwtAuthGuard)
  @Get('order/:orderId')
  getOrderPayments(
    @Param('orderId') orderId: string,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.getOrderPayments(orderId, user);
  }

  // ─────────────────────────────────────────────────────────
  // WEBHOOK ENDPOINTS (No auth — verified by signature)
  // ─────────────────────────────────────────────────────────

  /**
   * Razorpay webhook — server-to-server callback.
   * Authenticated via HMAC signature in X-Razorpay-Signature header.
   */
  @SkipThrottle()
  @Post('webhook/razorpay')
  async webhookRazorpay(
    @Req() req: any,
    @Headers('x-razorpay-signature') signature: string,
    @Body() body: any,
  ) {
    const rawBody = req.rawBody?.toString() || JSON.stringify(body);
    return this.paymentsService.handleRazorpayWebhook(rawBody, signature, body);
  }


  // ─────────────────────────────────────────────────────────
  // ADMIN ENDPOINTS
  // ─────────────────────────────────────────────────────────

  /**
   * Initiate a refund for a payment (admin only).
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('refund/:paymentId')
  processRefund(@Param('paymentId') paymentId: string, @Body() dto: RefundDto) {
    return this.paymentsService.processRefund(
      paymentId,
      dto.amount,
      dto.reason,
    );
  }

  /**
   * Payment analytics — totals, success rate, gateway breakdown.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/stats')
  getPaymentStats() {
    return this.paymentsService.getPaymentStats();
  }

  /**
   * Paginated list of all payments with filters.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/list')
  getAdminPayments(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
    @Query('gateway') gateway?: string,
  ) {
    return this.paymentsService.getAdminPayments(
      +page,
      +limit,
      status,
      gateway,
    );
  }
}
