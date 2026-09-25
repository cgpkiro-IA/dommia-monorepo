import { IsNotEmpty, IsString, IsEmail, IsOptional, IsInt, Min } from 'class-validator';

export class CreateProspectDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es requerido' })
  name: string;

  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre de la comunidad o fraccionamiento es requerido' })
  communityName: string;

  @IsInt({ message: 'El número de casas debe ser un número entero' })
  @Min(1, { message: 'Debe haber al menos 1 casa estimada' })
  @IsOptional()
  estimatedHouses?: number = 50;

  @IsString()
  @IsOptional()
  notes?: string;

  // Anti-bot scraping protection
  @IsString()
  @IsOptional()
  honeypot?: string;
}
