import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class SubscribeDto {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => String(value).toLowerCase().trim())
  email: string;
}
