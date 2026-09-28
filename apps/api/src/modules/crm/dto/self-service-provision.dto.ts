import { IsNotEmpty, IsString, IsEmail, IsInt, Min, MinLength, Matches, IsIn, IsOptional } from 'class-validator';

export class SelfServiceProvisionDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del fraccionamiento es requerido' })
  communityName: string;

  @IsString()
  @IsNotEmpty({ message: 'El identificador de subdominio (slug) es requerido' })
  @Matches(/^[a-z0-9_]{3,30}$/, {
    message: 'El subdominio debe contener entre 3 y 30 caracteres (minúsculas, números o guiones bajos)',
  })
  slug: string;

  @IsString()
  @IsIn(['BASIC', 'STANDARD', 'PROFESSIONAL', 'ENTERPRISE'], { message: 'Tier de suscripción inválido' })
  tier: string;

  @IsInt({ message: 'El número de viviendas debe ser un número entero' })
  @Min(5, { message: 'El mínimo de viviendas es 5' })
  maxProperties: number;

  @IsString()
  @IsNotEmpty({ message: 'El nombre del administrador es requerido' })
  adminName: string;

  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  adminEmail: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña de administrador debe tener al menos 8 caracteres' })
  adminPassword: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string = 'STRIPE_MOCK_CARD';

  @IsOptional()
  hasCustomDomain?: boolean = false;

  @IsOptional()
  selectedAddons?: string[] = [];

  // Honeypot for bot protection
  @IsOptional()
  honeypot?: string;
}

