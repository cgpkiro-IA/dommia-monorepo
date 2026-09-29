import { Type } from 'class-transformer';
import { IsIn, IsISO8601, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateGuardIncidentDto {
  @IsIn(['SECURITY', 'SUSPICIOUS_VEHICLE', 'MEDICAL', 'FIRE', 'MAINTENANCE', 'OTHER'])
  type!: string;

  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  propertyAddress?: string;

  @IsOptional()
  @Matches(/^[a-zA-Z0-9 -]{4,15}$/)
  vehiclePlates?: string;
}

export class CreateVehicleFlagDto {
  @Matches(/^[a-zA-Z0-9 -]{4,15}$/)
  plates!: string;

  @IsIn(['BLOCKED', 'FREQUENT_VISITOR'])
  flagType!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(300)
  reason!: string;
}

export class GuardHistoryQueryDto {
  @IsOptional()
  @IsIn(['ACCESS', 'DELIVERY_RECEIVED', 'DELIVERY_COLLECTED', 'INCIDENT'])
  type?: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  property?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class CreatePanicAlertDto {
  @IsIn(['MEDICAL', 'FIRE', 'INTRUSION', 'POLICE', 'OTHER'])
  panicType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  propertyAddress?: string;

  @IsOptional()
  @Matches(/^[a-zA-Z0-9 -]{4,15}$/)
  vehiclePlates?: string;
}