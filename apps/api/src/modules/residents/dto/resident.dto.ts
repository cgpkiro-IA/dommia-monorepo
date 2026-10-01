import { IsNotEmpty, IsString, IsOptional, IsEmail, IsBoolean, IsArray, IsUUID, IsIn, Matches, ValidateIf } from 'class-validator';

export class CreateResidentDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsOptional()
  @ValidateIf((_object, value) => value !== undefined && value !== null && value !== '')
  email?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((_object, value) => value !== undefined && value !== null && value !== '')
  @Matches(/^\d{10}$/, { message: 'El celular debe tener exactamente 10 dígitos.' })
  phone?: string;

  @IsString()
  @IsOptional()
  role?: string = 'OWNER';

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsString()
  @IsOptional()
  password?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateResidentDto {
  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  @ValidateIf((_object, value) => value !== undefined && value !== null && value !== '')
  email?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((_object, value) => value !== undefined && value !== null && value !== '')
  @Matches(/^\d{10}$/, { message: 'El celular debe tener exactamente 10 dígitos.' })
  phone?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class InviteResidentsDto {
  @ValidateIf((dto) => dto.residentIds !== 'ALL')
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  residentIds?: string[] | 'ALL';

  @IsBoolean()
  @IsOptional()
  all?: boolean;

  @IsUUID('4')
  @IsOptional()
  createdBy?: string;

  @IsIn(['AUTO', 'EMAIL', 'PHONE'])
  @IsOptional()
  contactMethod?: 'AUTO' | 'EMAIL' | 'PHONE';

  @IsIn(['NONE', 'EMAIL', 'WHATSAPP'])
  @IsOptional()
  delivery?: 'NONE' | 'EMAIL' | 'WHATSAPP';
}

export class InviteResidentDto {
  @IsUUID('4')
  @IsOptional()
  createdBy?: string;

  @IsIn(['AUTO', 'EMAIL', 'PHONE'])
  @IsOptional()
  contactMethod?: 'AUTO' | 'EMAIL' | 'PHONE';

  @IsIn(['NONE', 'EMAIL', 'WHATSAPP'])
  @IsOptional()
  delivery?: 'NONE' | 'EMAIL' | 'WHATSAPP';
}
