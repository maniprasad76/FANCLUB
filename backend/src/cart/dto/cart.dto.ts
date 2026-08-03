import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @IsString() @IsUUID() productId: string;
  @IsNumber() @Min(1) @Type(() => Number) quantity: number;
  @IsOptional() @IsString() @MaxLength(50) size?: string;
  @IsOptional() @IsString() @MaxLength(50) color?: string;
}

export class UpdateCartItemDto {
  @IsNumber() @Min(1) @Type(() => Number) quantity: number;
}
