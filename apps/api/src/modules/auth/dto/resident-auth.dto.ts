import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ResidentLoginDto {
  @IsString()
  @IsOptional()
  identifier?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  tenantSlug: string;
}

export class ResidentActivateDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(10)
  password: string;
}

export class ResidentChangePasswordDto {
  @IsString()
  @IsOptional()
  identifier?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  tenantSlug: string;

  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @MinLength(10)
  newPassword: string;
}

export class ResidentPasswordRecoveryRequestDto {
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @IsString()
  @IsNotEmpty()
  tenantSlug: string;
}

export class ResidentPasswordResetDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(10)
  newPassword: string;
}