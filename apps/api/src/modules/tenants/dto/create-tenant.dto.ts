import { IsNotEmpty, IsString, IsOptional, IsInt, Min, Matches, IsEmail, IsArray } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_-]+$/, { message: 'El slug solo debe contener letras minúsculas, números, guiones o guiones bajos' })
  slug: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  tier?: string = 'STANDARD';

  @IsInt()
  @Min(1)
  @IsOptional()
  maxProperties?: number = 100;

  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsOptional()
  hasCustomDomain?: boolean = false;

  @IsString()
  @IsOptional()
  customDomain?: string;

  @IsArray()
  @IsOptional()
  modules?: string[];
}

