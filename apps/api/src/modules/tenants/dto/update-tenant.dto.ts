import { IsString, IsOptional, IsInt, Min, IsEmail, IsBoolean, IsArray } from 'class-validator';

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  tier?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxProperties?: number;

  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsBoolean()
  @IsOptional()
  hasCustomDomain?: boolean;

  @IsString()
  @IsOptional()
  customDomain?: string;

  @IsString()
  @IsOptional()
  accessUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsOptional()
  modules?: string[];
}
