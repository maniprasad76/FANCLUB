import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class SignUpDto {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty()
  @Transform(({ value }) => String(value).toLowerCase().trim())
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @Transform(({ value }) => String(value).trim())
  name: string;
}
