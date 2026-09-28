import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateDeliveryDto {
  @IsString()
  @Length(2, 150)
  recipientName!: string;

  @IsString()
  @Length(2, 200)
  propertyAddress!: string;

  @IsString()
  @Length(2, 100)
  carrier!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  trackingCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CollectDeliveryDto {
  @IsString()
  @Length(2, 150)
  collectedByName!: string;
}