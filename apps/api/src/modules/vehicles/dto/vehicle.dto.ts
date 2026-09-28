import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsString()
  @IsOptional()
  residentId?: string;

  @IsString()
  @IsNotEmpty()
  plates: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  color?: string;
}

export class UpdateVehicleDto {
  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsString()
  @IsOptional()
  residentId?: string;

  @IsString()
  @IsOptional()
  plates?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  color?: string;
}
