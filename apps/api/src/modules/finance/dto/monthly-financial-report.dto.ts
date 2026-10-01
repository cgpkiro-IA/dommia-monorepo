import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const EXPENSE_CATEGORIES = [
  'SECURITY_PAYROLL',
  'ADMINISTRATION',
  'CLEANING',
  'GARDENING',
  'GATE_MAINTENANCE',
  'UTILITIES',
  'REPAIRS',
  'SUPPLIES',
  'INSURANCE',
  'BANK_FEES',
  'OTHER',
] as const;

export const EXPENSE_PAYMENT_METHODS = [
  'CASH',
  'SPEI_TRANSFER',
  'BANK_TRANSFER',
  'CHECK',
  'CARD',
  'OTHER',
] as const;

export class MonthlyReportPeriodDto {
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  year!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;
}

export class CreateMonthlyReportDto extends MonthlyReportPeriodDto {
  @IsNumber()
  openingBankBalance!: number;

  @IsNumber()
  openingCashBalance!: number;
}

export class CreateExpenseDto {
  @IsIn(EXPENSE_CATEGORIES)
  category!: typeof EXPENSE_CATEGORIES[number];

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  vendorName?: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  expenseDate!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsIn(EXPENSE_PAYMENT_METHODS)
  paymentMethod!: typeof EXPENSE_PAYMENT_METHODS[number];

  @IsOptional()
  @IsString()
  @MaxLength(128)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class ApproveExpenseDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  evidenceExceptionReason?: string;
}

export class UploadFinancialEvidenceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @IsIn(['application/pdf', 'image/jpeg', 'image/png'])
  contentType!: 'application/pdf' | 'image/jpeg' | 'image/png';

  @IsString()
  @IsNotEmpty()
  @MaxLength(5_000_000)
  contentBase64!: string;

  @IsIn(['ADMIN_ONLY', 'RESIDENTS'])
  visibility!: 'ADMIN_ONLY' | 'RESIDENTS';

  @IsBoolean()
  isRedacted!: boolean;
}

export class PublishMonthlyReportDto {
  @IsNumber()
  reportedBankBalance!: number;

  @IsNumber()
  reportedCashBalance!: number;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  publicationNotes?: string;
}
