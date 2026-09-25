import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TenantsModule } from '../tenants/tenants.module';
import { NoticesModule } from '../notices/notices.module';
import { FeeConfigurationController } from './controllers/fee-configuration.controller';
import { FeeConfigurationService } from './services/fee-configuration.service';
import { FeeConfigurationRepository } from './repositories/fee-configuration.repository';
import { BillingEngineController } from './controllers/billing-engine.controller';
import { BillingEngineService } from './services/billing-engine.service';
import { BillingEngineRepository } from './repositories/billing-engine.repository';

@Module({
  imports: [DatabaseModule, TenantsModule, NoticesModule],
  controllers: [FeeConfigurationController, BillingEngineController],
  providers: [
    FeeConfigurationService,
    FeeConfigurationRepository,
    BillingEngineService,
    BillingEngineRepository,
  ],
  exports: [
    FeeConfigurationService,
    FeeConfigurationRepository,
    BillingEngineService,
    BillingEngineRepository,
  ],
})
export class FinanceModule {}
