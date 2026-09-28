import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  exteriorNumber: string;

  @IsString()
  @IsOptional()
  interiorNumber?: string;

  @IsString()
  @IsOptional()
  block?: string;

  @IsString()
  @IsOptional()
  lot?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePropertyDto {
  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  exteriorNumber?: string;

  @IsString()
  @IsOptional()
  interiorNumber?: string;

  @IsString()
  @IsOptional()
  block?: string;

  @IsString()
  @IsOptional()
  lot?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isDelinquent?: boolean;
}
