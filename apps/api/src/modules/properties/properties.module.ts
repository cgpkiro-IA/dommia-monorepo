import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TenantsModule } from '../tenants/tenants.module';
import { PropertiesController } from './controllers/properties.controller';
import { PropertiesService } from './services/properties.service';
import { PropertiesRepository } from './repositories/properties.repository';

@Module({
  imports: [DatabaseModule, TenantsModule],
  controllers: [PropertiesController],
  providers: [PropertiesService, PropertiesRepository],
  exports: [PropertiesService, PropertiesRepository],
})
export class PropertiesModule {}
