import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TenantsModule } from '../tenants/tenants.module';
import { VehiclesController } from './controllers/vehicles.controller';
import { VehiclesService } from './services/vehicles.service';
import { VehiclesRepository } from './repositories/vehicles.repository';

@Module({
  imports: [DatabaseModule, TenantsModule],
  controllers: [VehiclesController],
  providers: [VehiclesService, VehiclesRepository],
  exports: [VehiclesService, VehiclesRepository],
})
export class VehiclesModule {}
