import { IsString, IsInt, IsOptional, Min, Max, MaxLength, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsString()
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1, { message: 'Rating must be between 1 and 5' })
  @Max(5, { message: 'Rating must be between 1 and 5' })
  @Type(() => Number)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Review comment must be 2000 characters or less' })
  comment?: string;
}
