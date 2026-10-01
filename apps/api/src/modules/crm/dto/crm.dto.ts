import { IsBoolean, IsIn, IsIP, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import type { CreateAlertDto } from '../services/crm-alerts.service';

export class GatewayHeartbeatDto {
  @IsOptional()
  @IsIP()
  ipLocal?: string;
}

export class UpdateGatewayDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  firmwareVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateCrmAlertDto implements CreateAlertDto {
  @IsIn(['CRITICAL', 'WARNING', 'INFO'])
  severity!: 'CRITICAL' | 'WARNING' | 'INFO';

  @IsIn(['CHANNELS', 'SECURITY', 'BILLING', 'SYSTEM', 'TELEMETRY'])
  category!: 'CHANNELS' | 'SECURITY' | 'BILLING' | 'SYSTEM' | 'TELEMETRY';

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  tenantSlug?: string;
}

export class ResolveCrmAlertDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateTelegramConfigDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  botToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  chatId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  botUsername?: string;
}

export class TestTelegramNotificationDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  botToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  chatId?: string;
}