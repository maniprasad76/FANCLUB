import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from '@prisma/client';

export class CreateProductDto {
  @IsString() name: string;
  @IsString() slug: string;
  @IsString() description: string;
  @IsNumber() @Min(0) @Type(() => Number) price: number;
  @IsOptional() @IsNumber() @Type(() => Number) comparePrice?: number;
  @IsArray() @IsString({ each: true }) images: string[];
  @IsArray() @IsString({ each: true }) sizes: string[];
  @IsArray() @IsString({ each: true }) colors: string[];
  @IsString() categoryId: string;
  @IsNumber() @Min(0) @Type(() => Number) stock: number;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsBoolean() bestseller?: boolean;
  @IsOptional() @IsBoolean() newArrival?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() gender?: Gender;
}

export class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Type(() => Number) price?: number;
  @IsOptional() @IsNumber() @Type(() => Number) comparePrice?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) sizes?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) colors?: string[];
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsNumber() @Type(() => Number) stock?: number;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsBoolean() bestseller?: boolean;
  @IsOptional() @IsBoolean() newArrival?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() gender?: Gender;
}

export class ProductQueryDto {
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() sort?: string;
  @IsOptional() @IsNumber() @Type(() => Number) minPrice?: number;
  @IsOptional() @IsNumber() @Type(() => Number) maxPrice?: number;
  @IsOptional() @IsString() size?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsBoolean() bestseller?: boolean;
  @IsOptional() @IsBoolean() newArrival?: boolean;
  @IsOptional() @IsNumber() @Type(() => Number) page?: number;
  @IsOptional() @IsNumber() @Type(() => Number) limit?: number;
  @IsOptional() @IsString() gender?: string;
}
