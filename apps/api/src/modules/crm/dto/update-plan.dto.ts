import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, Min } from 'class-validator';

export class UpdatePlanDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyPrice?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  minProperties?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxProperties?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  pricePerExtraProperty?: number;

  @IsBoolean()
  @IsOptional()
  includesCustomDomain?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  customDomainAddonPrice?: number;

  @IsArray()
  @IsOptional()
  includedModules?: string[];

  @IsArray()
  @IsOptional()
  availableAddons?: Array<{ code: string; name: string; price: number }>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isHighlighted?: boolean;
}
