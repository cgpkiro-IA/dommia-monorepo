import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export enum FeeType {
  FIXED_RECURRENT = 'FIXED_RECURRENT',
  VARIABLE_LOT_SIZE = 'VARIABLE_LOT_SIZE',
  EXTRAORDINARY = 'EXTRAORDINARY',
}

export enum FeeFrequency {
  MONTHLY = 'MONTHLY',
  BI_MONTHLY = 'BI_MONTHLY',
  ANNUAL = 'ANNUAL',
  ONE_TIME = 'ONE_TIME',
}

export enum LateFeeType {
  NONE = 'NONE',
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export enum EarlyBirdDiscountType {
  NONE = 'NONE',
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export class CreateFeeConfigurationDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del concepto de cuota es obligatorio' })
  name: string;

  @IsEnum(FeeType, { message: 'Tipo de cuota inválido (FIXED_RECURRENT, VARIABLE_LOT_SIZE, EXTRAORDINARY)' })
  feeType: FeeType;

  @IsNumber()
  @Min(0, { message: 'El monto base no puede ser negativo' })
  baseAmount: number;

  @IsEnum(FeeFrequency, { message: 'Frecuencia inválida (MONTHLY, BI_MONTHLY, ANNUAL, ONE_TIME)' })
  @IsOptional()
  frequency?: FeeFrequency = FeeFrequency.MONTHLY;

  @IsNumber()
  @Min(1)
  @Max(31)
  @IsOptional()
  dueDay?: number = 10;

  @IsNumber()
  @Min(0)
  @Max(30)
  @IsOptional()
  graceDays?: number = 5;

  @IsEnum(LateFeeType)
  @IsOptional()
  lateFeeType?: LateFeeType = LateFeeType.PERCENTAGE;

  @IsNumber()
  @Min(0)
  @IsOptional()
  lateFeeAmount?: number = 10.0;

  @IsEnum(EarlyBirdDiscountType)
  @IsOptional()
  earlyBirdDiscountType?: EarlyBirdDiscountType = EarlyBirdDiscountType.NONE;

  @IsNumber()
  @Min(0)
  @IsOptional()
  earlyBirdDiscountAmount?: number = 0.0;

  @IsNumber()
  @Min(1)
  @Max(31)
  @IsOptional()
  earlyBirdDeadlineDay?: number;

  @IsBoolean()
  @IsOptional()
  appliesToAllProperties?: boolean = true;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateFeeConfigurationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(FeeType)
  @IsOptional()
  feeType?: FeeType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  baseAmount?: number;

  @IsEnum(FeeFrequency)
  @IsOptional()
  frequency?: FeeFrequency;

  @IsNumber()
  @Min(1)
  @Max(31)
  @IsOptional()
  dueDay?: number;

  @IsNumber()
  @Min(0)
  @Max(30)
  @IsOptional()
  graceDays?: number;

  @IsEnum(LateFeeType)
  @IsOptional()
  lateFeeType?: LateFeeType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  lateFeeAmount?: number;

  @IsEnum(EarlyBirdDiscountType)
  @IsOptional()
  earlyBirdDiscountType?: EarlyBirdDiscountType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  earlyBirdDiscountAmount?: number;

  @IsNumber()
  @Min(1)
  @Max(31)
  @IsOptional()
  earlyBirdDeadlineDay?: number;

  @IsBoolean()
  @IsOptional()
  appliesToAllProperties?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}
