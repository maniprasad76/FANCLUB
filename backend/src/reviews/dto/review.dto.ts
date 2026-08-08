import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  ArrayMaxSize,
  IsUrl,
  Min,
  Max,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Maximum number of photos a single review can carry. */
export const MAX_REVIEW_PHOTOS = 3;

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
  @MaxLength(2000, {
    message: 'Review comment must be 2000 characters or less',
  })
  comment?: string;

  /** Public image URLs uploaded via POST /upload/review-image. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_REVIEW_PHOTOS, {
    message: `A review can include at most ${MAX_REVIEW_PHOTOS} photos`,
  })
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { each: true, message: 'Each photo must be a valid http(s) URL' },
  )
  photos?: string[];
}
