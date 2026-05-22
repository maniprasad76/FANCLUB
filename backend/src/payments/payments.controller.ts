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
 *   POST /payments/webhook/stripe   — Stripe server-to-server callback
 *
 * Authenticated endpoints:
 *   POST /payments/create-order     — Create a payment order for checkout
 *   POST /payments/verify           — Verify Razorpay payment callback
 *   GET  /payments/stripe/verify    — Verify Stripe session after redirect
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
   * Auto-routes to Razorpay or Stripe based on country.
   */
  @UseGuards(JwtAuthGuard)
  @Post('create-order')
  createOrder(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPaymentOrder(
      dto.orderId,
      dto.gateway,
      dto.country,
      dto.currency || 'INR',
    );
  }

  /**
   * Verify a Razorpay payment callback (frontend → backend).
   * Never trust frontend payment success — this verifies the HMAC signature.
   */
  @UseGuards(JwtAuthGuard)
  @Post('verify')
  verifyRazorpay(@Body() dto: VerifyRazorpayDto) {
    return this.paymentsService.verifyRazorpayPayment(
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.signature,
    );
  }

  /**
   * Verify a Stripe session — called when customer returns from Stripe Checkout.
   */
  @UseGuards(JwtAuthGuard)
  @Get('stripe/verify')
  verifyStripe(@Query('session_id') sessionId: string) {
    if (!sessionId) throw new BadRequestException('Missing session_id');
    return this.paymentsService.verifyStripePayment(sessionId);
  }

  /**
   * Retry a failed/pending payment with a new attempt.
   */
  @UseGuards(JwtAuthGuard)
  @Post('retry/:orderId')
  retryPayment(
    @Param('orderId') orderId: string,
    @Body() dto: RetryPaymentDto,
  ) {
    return this.paymentsService.retryPayment(orderId, dto.gateway);
  }

  /**
   * Get the status of a specific payment.
   */
  @UseGuards(JwtAuthGuard)
  @Get(':paymentId/status')
  getPaymentStatus(@Param('paymentId') paymentId: string) {
    return this.paymentsService.getPaymentStatus(paymentId);
  }

  /**
   * Get all payments for a specific order.
   */
  @UseGuards(JwtAuthGuard)
  @Get('order/:orderId')
  getOrderPayments(@Param('orderId') orderId: string) {
    return this.paymentsService.getOrderPayments(orderId);
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

  /**
   * Stripe webhook — server-to-server callback.
   * Authenticated via Stripe's constructEvent with webhook secret.
   */
  @SkipThrottle()
  @Post('webhook/stripe')
  async webhookStripe(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    return this.paymentsService.handleStripeWebhook(rawBody, signature);
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
