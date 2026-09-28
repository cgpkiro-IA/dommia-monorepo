import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TenantsModule } from '../tenants/tenants.module';
import { CrmController } from './controllers/crm.controller';
import { CrmService } from './services/crm.service';
import { CrmRepository } from './repositories/crm.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, TenantsModule, AuthModule],
  controllers: [CrmController],
  providers: [CrmService, CrmRepository],
  exports: [CrmService, CrmRepository],
})
export class CrmModule {}
