import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  MaxLength,
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

export class SubmitSpeiPaymentDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsString()
  @IsOptional()
  chargeId?: string;

  @IsNumber()
  @Min(0.01, { message: 'El monto transferido debe ser mayor a 0.' })
  amount: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  reference: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5_000_000)
  receiptUrl: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  payerName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

export class ReviewPaymentDto {
  @IsString()
  @IsIn(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  reviewedByName: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

export class CreateAnnualCampaignDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  discountPercentage: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  monthsCovered: number = 12;

  @IsString()
  @IsNotEmpty()
  periodStart: string;

  @IsString()
  @IsNotEmpty()
  periodEnd: string;
}

export class AnnualCampaignQuoteDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;
}

export class SubmitAnnualPaymentDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  reference: string;

  @IsString()
  @IsOptional()
  @MaxLength(5_000_000)
  receiptUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  payerName?: string;
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
