import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty()
  @Transform(({ value }) => String(value).toLowerCase().trim())
  email: string;

  @IsOptional()
  @IsString()
  redirectTo?: string;
}
