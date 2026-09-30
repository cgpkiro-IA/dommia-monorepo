import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TenantsModule } from '../tenants/tenants.module';
import { PropertiesController } from './controllers/properties.controller';
import { PropertiesService } from './services/properties.service';
import { PropertiesRepository } from './repositories/properties.repository';
import { FinanceAdminGuard } from '../auth/guards/finance-admin.guard';

@Module({
  imports: [DatabaseModule, TenantsModule],
  controllers: [PropertiesController],
  providers: [PropertiesService, PropertiesRepository, FinanceAdminGuard],
  exports: [PropertiesService, PropertiesRepository],
})
export class PropertiesModule {}
