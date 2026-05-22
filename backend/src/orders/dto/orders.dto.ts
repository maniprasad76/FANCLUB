import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  @IsOptional() @IsNumber() @Type(() => Number) shippingAmount?: number;
  @IsString() addressId: string;
  @IsOptional() @IsString() paymentMethod?: string;
  @IsOptional() @IsString() notes?: string;

  /** Payment gateway — RAZORPAY, STRIPE, or auto (based on country). */
  @IsOptional() @IsString() gateway?: string;

  /** Customer country — used for gateway auto-routing. Read from address if omitted. */
  @IsOptional() @IsString() country?: string;

  /** Currency code — defaults to INR. */
  @IsOptional() @IsString() currency?: string;
}

export class UpdateOrderStatusDto {
  @IsString() status: string;
  @IsOptional() @IsString() trackingId?: string;
}
