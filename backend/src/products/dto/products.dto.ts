import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  MaxLength,
  Matches,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from '@prisma/client';

export class CreateProductDto {
  @IsString() @MaxLength(200) name: string;
  @IsString() @MaxLength(200) @Matches(/^[a-z0-9-]+$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens' }) slug: string;
  @IsString() @MaxLength(5000) description: string;
  @IsNumber() @Min(0) @Type(() => Number) price: number;
  @IsOptional() @IsNumber() @Type(() => Number) comparePrice?: number;
  @IsArray() @IsString({ each: true }) @MaxLength(500, { each: true }) images: string[];
  @IsArray() @IsString({ each: true }) @MaxLength(50, { each: true }) sizes: string[];
  @IsArray() @IsString({ each: true }) @MaxLength(50, { each: true }) colors: string[];
  @IsString() @IsUUID() categoryId: string;
  @IsNumber() @Min(0) @Type(() => Number) stock: number;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsBoolean() bestseller?: boolean;
  @IsOptional() @IsBoolean() newArrival?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(50, { each: true }) tags?: string[];
  @IsOptional() @IsString() gender?: Gender;
}

export class UpdateProductDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(200) @Matches(/^[a-z0-9-]+$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens' }) slug?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsNumber() @Type(() => Number) price?: number;
  @IsOptional() @IsNumber() @Type(() => Number) comparePrice?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(500, { each: true }) images?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(50, { each: true }) sizes?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(50, { each: true }) colors?: string[];
  @IsOptional() @IsString() @IsUUID() categoryId?: string;
  @IsOptional() @IsNumber() @Type(() => Number) stock?: number;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsBoolean() bestseller?: boolean;
  @IsOptional() @IsBoolean() newArrival?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(50, { each: true }) tags?: string[];
  @IsOptional() @IsString() gender?: Gender;
}

export class ProductQueryDto {
  @IsOptional() @IsString() @MaxLength(100) category?: string;
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsString() @MaxLength(50) sort?: string;
  @IsOptional() @IsNumber() @Type(() => Number) minPrice?: number;
  @IsOptional() @IsNumber() @Type(() => Number) maxPrice?: number;
  @IsOptional() @IsString() @MaxLength(50) size?: string;
  @IsOptional() @IsString() @MaxLength(50) color?: string;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsBoolean() bestseller?: boolean;
  @IsOptional() @IsBoolean() newArrival?: boolean;
  @IsOptional() @IsNumber() @Type(() => Number) page?: number;
  @IsOptional() @IsNumber() @Type(() => Number) limit?: number;
  @IsOptional() @IsString() @MaxLength(20) gender?: string;
}
