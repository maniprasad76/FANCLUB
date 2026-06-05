import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  IsString,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Strict enum — only COD and ONLINE are valid payment methods. */
export enum PaymentMethodEnum {
  COD = 'COD',
  ONLINE = 'ONLINE',
}

/** Strict enum — only Razorpay gateway accepted. */
export enum GatewayEnum {
  RAZORPAY = 'RAZORPAY',
}

/** Allowlisted currencies. Prevents gateway confusion for unsupported currencies. */
const ALLOWED_CURRENCIES = [
  'INR',
  'USD',
  'GBP',
  'EUR',
  'AUD',
  'CAD',
  'SGD',
  'AED',
  'JPY',
] as const;

export class OrderItemDto {
  @IsString() productId: string;
  @IsNumber() @Min(1) @Type(() => Number) quantity: number;
  @IsOptional() @IsString() size?: string;
  @IsOptional() @IsString() color?: string;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  addressId: string;

  /**
   * Strict enum — only 'COD' or 'ONLINE'.
   * Defaults to 'COD' if omitted.
   */
  @IsOptional()
  @IsEnum(PaymentMethodEnum)
  paymentMethod?: PaymentMethodEnum;

  /** Payment gateway — RAZORPAY only. */
  @IsOptional()
  @IsEnum(GatewayEnum)
  gateway?: GatewayEnum;

  /** Customer country — used for gateway auto-routing. Read from address if omitted. */
  @IsOptional()
  @IsString()
  country?: string;

  /** Currency code — must be an allowlisted value. Defaults to INR. */
  @IsOptional()
  @IsIn(ALLOWED_CURRENCIES)
  currency?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Valid order status transitions for admin updates.
 * State machine: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
 * Side exits: CANCELLED (from any pre-SHIPPED state), REFUNDED (only after DELIVERED via payment flow).
 */
export enum OrderStatusEnum {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatusEnum)
  status: OrderStatusEnum;

  @IsOptional()
  @IsString()
  trackingId?: string;
}
