import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ResidentAppReceiptUploadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5_000_000)
  contentBase64!: string;

  @IsIn(['application/pdf', 'image/jpeg', 'image/png'])
  contentType!: 'application/pdf' | 'image/jpeg' | 'image/png';
}

export class ResidentAppSpeiSubmissionDto {
  @IsString()
  @IsOptional()
  chargeId?: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  reference!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5_000_000)
  receiptUrl!: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  payerName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

export class ResidentAppAnnualPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  reference!: string;

  @IsString()
  @IsOptional()
  @MaxLength(5_000_000)
  receiptUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  payerName?: string;
}
