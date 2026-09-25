import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateMonthlyChargesDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(2020)
  @Max(2050)
  year?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(12)
  month?: number;

  @IsBoolean()
  @IsOptional()
  dryRun?: boolean = false;
}

export class CreatePaymentDto {
  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsString()
  @IsOptional()
  property_id?: string;

  @IsString()
  @IsOptional()
  chargeId?: string;

  @IsString()
  @IsOptional()
  charge_id?: string;

  @IsNumber()
  @Min(0.01, { message: 'El monto pagado debe ser mayor a 0.' })
  amount: number;

  @IsString()
  @IsOptional()
  @IsIn(['CASH', 'SPEI_TRANSFER', 'BANK_DEPOSIT', 'STRIPE_CARD'])
  paymentMethod?: string = 'CASH';

  @IsString()
  @IsOptional()
  @IsIn(['CASH', 'SPEI_TRANSFER', 'BANK_DEPOSIT', 'STRIPE_CARD'])
  payment_method?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  receivedByName?: string = 'Administración';

  @IsString()
  @IsOptional()
  received_by_name?: string;

  @IsString()
  @IsOptional()
  payerName?: string;

  @IsString()
  @IsOptional()
  payer_name?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @IsString()
  @IsOptional()
  receipt_url?: string;
}

export class QueryChargesDto {
  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  year?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  month?: number;
}

export class QueryPaymentsDto {
  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
