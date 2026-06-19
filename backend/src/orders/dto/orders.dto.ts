import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  IsString,
  IsIn,
  MaxLength,
  IsUUID,
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
  @IsString() @IsUUID() productId: string;
  @IsNumber() @Min(1) @Type(() => Number) quantity: number;
  @IsOptional() @IsString() @MaxLength(50) size?: string;
  @IsOptional() @IsString() @MaxLength(50) color?: string;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  @IsUUID()
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
  @MaxLength(100)
  country?: string;

  /** Currency code — must be an allowlisted value. Defaults to INR. */
  @IsOptional()
  @IsIn(ALLOWED_CURRENCIES)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  couponCode?: string;
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
  @MaxLength(255)
  trackingId?: string;
}
