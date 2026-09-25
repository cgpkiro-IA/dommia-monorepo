import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateStageDto {
  @IsString()
  @IsNotEmpty({ message: 'La etapa es requerida' })
  @IsIn(['LEAD', 'CONTACTED', 'DEMO', 'PROPOSAL', 'WON', 'LOST'], {
    message: 'Etapa inválida. Debe ser: LEAD, CONTACTED, DEMO, PROPOSAL, WON o LOST',
  })
  stage: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
