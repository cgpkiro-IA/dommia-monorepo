import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, IsStrongPassword, IsUUID, Length, Max, MaxLength, Min } from 'class-validator';

export class CreateVisitorInvitationDto {
  @IsString()
  @Length(2, 150)
  visitorName!: string;

  @IsIn(['SINGLE_USE', 'TEMPORARY', 'FREQUENT'])
  passType!: 'SINGLE_USE' | 'TEMPORARY' | 'FREQUENT';

  @IsInt()
  @Min(1)
  @Max(30)
  validDays!: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

export class ValidateAccessDto {
  @IsString()
  @MaxLength(512)
  payload!: string;
}

export class ManualAccessOverrideDto {
  @IsString()
  @Length(64, 2048)
  overrideToken!: string;

  @IsString()
  @Length(20, 500)
  justification!: string;
}

export class ManualVisitAccessDto {
  @IsBoolean()
  identityVerified!: boolean;

  @IsBoolean()
  callConfirmed!: boolean;
}

export class CreateGuardUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(1, 100)
  firstName!: string;

  @IsString()
  @Length(1, 100)
  lastName!: string;

  @IsStrongPassword({ minLength: 10, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
  password!: string;
}

export class CreateGuardAccessPointDto {
  @IsString()
  @Length(2, 80)
  name!: string;
}

export class UpdateGuardAccessPointDto {
  @IsOptional()
  @IsString()
  @Length(2, 80)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export type GuardServiceType =
  | 'FOOD_DELIVERY'
  | 'GAS_SUPPLY'
  | 'WATER_SUPPLY'
  | 'PARCEL_COURIER'
  | 'TAXI_RIDE'
  | 'MAINTENANCE'
  | 'OTHER';

export class ServiceDestinationItemDto {
  @IsString()
  propertyId!: string;

  @IsString()
  propertyAddress!: string;

  @IsOptional()
  @IsString()
  residentId?: string;

  @IsOptional()
  @IsString()
  residentName?: string;

  @IsOptional()
  @IsString()
  residentPhone?: string;

  @IsOptional()
  @IsString()
  residentEmail?: string;
}

export class CreateGuardServiceDto {
  @IsIn(['FOOD_DELIVERY', 'GAS_SUPPLY', 'WATER_SUPPLY', 'PARCEL_COURIER', 'TAXI_RIDE', 'MAINTENANCE', 'OTHER'])
  serviceType!: GuardServiceType;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  customServiceName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  supplierName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  vehiclePlates?: string;

  @IsIn(['SPECIFIC', 'GENERAL'])
  destinationType!: 'SPECIFIC' | 'GENERAL';

  @IsOptional()
  destinations?: ServiceDestinationItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsUUID()
  accessPointId?: string;
}

export class RegisterServiceExitDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsUUID()
  accessPointId?: string;
}

export class UnifiedAuditLogQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  category?: 'ALL' | 'ACCESS' | 'SERVICE' | 'INCIDENT' | 'DELIVERY' | 'NOTICE';

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

export interface UnifiedAuditLogItem {
  id: string;
  eventType: string;
  category: 'ACCESS' | 'SERVICE' | 'INCIDENT' | 'DELIVERY' | 'NOTICE';
  title: string;
  description: string;
  propertyAddress?: string;
  vehiclePlates?: string;
  isGranted: boolean;
  status: string;
  rejectionReason?: string;
  notes?: string;
  actorName?: string;
  createdAt: string;
}

export interface UnifiedAuditLogSummary {
  totalEvents: number;
  grantedAccessCount: number;
  rejectedAccessCount: number;
  servicesCount: number;
  incidentsCount: number;
  deliveriesCount: number;
  noticesCount: number;
}