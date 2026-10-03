import { IsBoolean, IsDateString, IsEmail, IsIn, IsNumber, IsOptional, Min } from 'class-validator';

export class ReconcileContractDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsIn(['MONTHLY', 'ANNUAL'])
  billingInterval?: 'MONTHLY' | 'ANNUAL';

  @IsDateString()
  currentPeriodEnd: string;
}

export class RecordRenewalNoticeDto {
  @IsEmail()
  recipient: string;

  @IsBoolean()
  noticeSent: boolean;
}

export class SendRenewalNoticeDto {
  @IsEmail()
  recipient: string;
}

export class CreateInitialContractDto {
  @IsOptional()
  @IsIn(['MONTHLY', 'ANNUAL'])
  billingInterval?: 'MONTHLY' | 'ANNUAL';
}