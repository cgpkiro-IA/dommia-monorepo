import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ResidentsController } from './controllers/residents.controller';
import { ResidentsService } from './services/residents.service';
import { ResidentsRepository } from './repositories/residents.repository';

@Module({
  imports: [DatabaseModule, TenantsModule],
  controllers: [ResidentsController],
  providers: [ResidentsService, ResidentsRepository],
  exports: [ResidentsService, ResidentsRepository],
})
export class ResidentsModule {}
