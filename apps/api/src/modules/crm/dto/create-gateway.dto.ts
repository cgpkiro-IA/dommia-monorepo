import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateGatewayDto {
  @IsString()
  @IsNotEmpty({ message: 'El UUID único del hardware es requerido' })
  uuid: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre del Gateway o caseta es requerido' })
  name: string;

  @IsUUID('4', { message: 'El tenantId debe ser un UUID válido' })
  @IsOptional()
  tenantId?: string;

  @IsString()
  @IsOptional()
  firmwareVersion?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
