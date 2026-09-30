import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class ResidentAppLoginDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  identifier!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(256)
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(150)
  tenantSlug!: string;

  @IsIn(['ANDROID', 'IOS'])
  clientType!: 'ANDROID' | 'IOS';

  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceName?: string;
}

export class ResidentAppRefreshDto {
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  refreshToken!: string;
}

export class ResidentAppChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  identifier!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(150)
  tenantSlug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(256)
  currentPassword!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(256)
  newPassword!: string;
}

export class ResidentAppPasswordRecoveryRequestDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @IsString()
  @IsNotEmpty()
  tenantSlug!: string;
}

export class ResidentAppPasswordResetDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(256)
  newPassword!: string;
}

export class ResidentAppPushTokenDto {
  @IsUUID()
  deviceId!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(4096)
  token!: string;
}