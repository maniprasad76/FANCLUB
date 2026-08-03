import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  Matches,
  IsUrl,
} from 'class-validator';

const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;
const phoneMessage = 'Please enter a valid phone number';

export class UpdateUserDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional()
  @IsString()
  @Matches(phoneRegex, { message: phoneMessage })
  phone?: string;
  @IsOptional() @IsString() @IsUrl() @MaxLength(500) avatar?: string;
}

export class CreateAddressDto {
  @IsString() @MaxLength(100) name: string;
  @IsString() @Matches(phoneRegex, { message: phoneMessage }) phone: string;
  @IsString() @MaxLength(255) street: string;
  @IsString() @MaxLength(100) city: string;
  @IsString() @MaxLength(100) state: string;
  @IsString() @MaxLength(20) pincode: string;
  @IsOptional() @IsString() @MaxLength(100) country?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional()
  @IsString()
  @Matches(phoneRegex, { message: phoneMessage })
  phone?: string;
  @IsOptional() @IsString() @MaxLength(255) street?: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsString() @MaxLength(100) state?: string;
  @IsOptional() @IsString() @MaxLength(20) pincode?: string;
  @IsOptional() @IsString() @MaxLength(100) country?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}
