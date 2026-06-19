import { IsString, IsOptional, IsNumber, Min, IsUUID, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for creating a new payment for an existing order.
 * The gateway is auto-selected from the customer's country, but can be overridden.
 */
export class CreatePaymentDto {
  @IsString()
  @IsUUID()
  orderId: string;

  /** Optional: RAZORPAY or COD. Auto-routed if omitted. */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  gateway?: string;

  /** Customer country — used for gateway auto-routing. Defaults to 'India'. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  /** Currency code — defaults to INR. */
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;
}

/**
 * DTO for verifying a Razorpay payment callback.
 */
export class VerifyRazorpayDto {
  @IsString()
  @MaxLength(255)
  razorpayOrderId: string;

  @IsString()
  @MaxLength(255)
  razorpayPaymentId: string;

  @IsString()
  @MaxLength(255)
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
  @MaxLength(500)
  reason?: string;
}

/**
 * DTO for retrying a failed payment.
 */
export class RetryPaymentDto {
  /** Override gateway for the retry. */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  gateway?: string;
}
