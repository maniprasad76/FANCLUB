import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for creating a new payment for an existing order.
 * The gateway is auto-selected from the customer's country, but can be overridden.
 */
export class CreatePaymentDto {
  @IsString()
  orderId: string;

  /** Optional: RAZORPAY, STRIPE, or COD. Auto-routed from country if omitted. */
  @IsOptional()
  @IsString()
  gateway?: string;

  /** Customer country — used for gateway auto-routing. Defaults to 'India'. */
  @IsOptional()
  @IsString()
  country?: string;

  /** Currency code — defaults to INR. */
  @IsOptional()
  @IsString()
  currency?: string;
}

/**
 * DTO for verifying a Razorpay payment callback.
 */
export class VerifyRazorpayDto {
  @IsString()
  razorpayOrderId: string;

  @IsString()
  razorpayPaymentId: string;

  @IsString()
  signature: string;
}

/**
 * DTO for initiating a refund.
 */
export class RefundDto {
  /** Partial refund amount. Omit for full refund. */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * DTO for retrying a failed payment.
 */
export class RetryPaymentDto {
  /** Override gateway for the retry. */
  @IsOptional()
  @IsString()
  gateway?: string;
}
