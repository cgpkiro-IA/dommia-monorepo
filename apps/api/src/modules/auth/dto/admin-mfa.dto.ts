import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifyMfaLoginDto {
  @IsString()
  @IsNotEmpty()
  challengeToken: string;

  @Matches(/^\d{6}$/)
  code: string;
}

export class StartMfaSetupDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class MfaCodeDto {
  @Matches(/^\d{6}$/)
  code: string;
}

export class DisableMfaDto extends MfaCodeDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SelectTenantDto {
  @IsString()
  @IsNotEmpty()
  tenantSlug: string;
}