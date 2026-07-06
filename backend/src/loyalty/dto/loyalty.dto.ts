import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

export class ClaimRewardDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class AdminUpdateProgressDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  completedOrders?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  currentCycle?: number;

  @IsOptional()
  @IsBoolean()
  rewardUnlocked?: boolean;

  @IsOptional()
  @IsBoolean()
  rewardClaimed?: boolean;
}
