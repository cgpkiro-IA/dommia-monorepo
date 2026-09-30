import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TenantsController } from './controllers/tenants.controller';
import { TenantsService } from './services/tenants.service';
import { TenantsRepository } from './repositories/tenants.repository';
import { AdminSessionGuard } from '../auth/guards/admin-session.guard';
import { CrmAdminGuard } from '../auth/guards/crm-admin.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [TenantsController],
  providers: [TenantsService, TenantsRepository, AdminSessionGuard, CrmAdminGuard],
  exports: [TenantsService, TenantsRepository],
})
export class TenantsModule {}
