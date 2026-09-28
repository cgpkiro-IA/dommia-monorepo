import { IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class NotificationConfigDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsIn(['SMTP', 'WHATSAPP_BUSINESS'])
  channel: 'SMTP' | 'WHATSAPP_BUSINESS';

  @IsString()
  @IsOptional()
  smtpHost?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  smtpPort?: number;

  @IsBoolean()
  @IsOptional()
  smtpSecure?: boolean;

  @IsString()
  @IsOptional()
  smtpUser?: string;

  @IsString()
  @IsOptional()
  smtpPassword?: string;

  @IsEmail()
  @IsOptional()
  fromEmail?: string;

  @IsString()
  @IsOptional()
  fromName?: string;

  @IsString()
  @IsOptional()
  whatsappAccessToken?: string;

  @IsString()
  @IsOptional()
  whatsappPhoneNumberId?: string;

  @IsString()
  @IsOptional()
  whatsappBusinessAccountId?: string;

  @IsString()
  @IsOptional()
  whatsappApiVersion?: string;
}