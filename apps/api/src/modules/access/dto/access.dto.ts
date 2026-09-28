import { IsEmail, IsIn, IsInt, IsOptional, IsString, IsStrongPassword, Length, Max, MaxLength, Min } from 'class-validator';

export class CreateVisitorInvitationDto {
  @IsString()
  @Length(2, 150)
  visitorName!: string;

  @IsIn(['SINGLE_USE', 'TEMPORARY', 'FREQUENT'])
  passType!: 'SINGLE_USE' | 'TEMPORARY' | 'FREQUENT';

  @IsInt()
  @Min(1)
  @Max(30)
  validDays!: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

export class ValidateAccessDto {
  @IsString()
  @MaxLength(512)
  payload!: string;
}

export class ManualAccessOverrideDto {
  @IsString()
  @Length(64, 2048)
  overrideToken!: string;

  @IsString()
  @Length(20, 500)
  justification!: string;
}

export class CreateGuardUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(1, 100)
  firstName!: string;

  @IsString()
  @Length(1, 100)
  lastName!: string;

  @IsStrongPassword({ minLength: 10, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
  password!: string;
}