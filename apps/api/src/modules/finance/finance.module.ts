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
import { FinanceSchedulerService } from './services/finance-scheduler.service';
import { FinanceAdminGuard } from '../auth/guards/finance-admin.guard';
import { AuthModule } from '../auth/auth.module';
import { ResidentAppFinanceController } from './controllers/resident-app-finance.controller';
import { ResidentAppReceiptStorageService } from './services/resident-app-receipt-storage.service';
import { FinanceCampaignGuard } from './guards/finance-campaign.guard';
import { MonthlyFinancialReportController } from './controllers/monthly-financial-report.controller';
import { ResidentMonthlyFinancialReportController } from './controllers/resident-monthly-financial-report.controller';
import { ResidentAppMonthlyFinancialReportController } from './controllers/resident-app-monthly-financial-report.controller';
import { MonthlyFinancialReportRepository } from './repositories/monthly-financial-report.repository';
import { MonthlyFinancialReportService } from './services/monthly-financial-report.service';
import { FinancialEvidenceStorageService } from './services/financial-evidence-storage.service';
import { MonthlyReportAdminGuard } from './guards/monthly-report-admin.guard';

@Module({
  imports: [DatabaseModule, TenantsModule, NoticesModule, AuthModule],
  controllers: [
    FeeConfigurationController,
    BillingEngineController,
    ResidentAppFinanceController,
    MonthlyFinancialReportController,
    ResidentMonthlyFinancialReportController,
    ResidentAppMonthlyFinancialReportController,
  ],
  providers: [
    FeeConfigurationService,
    FeeConfigurationRepository,
    BillingEngineService,
    BillingEngineRepository,
    FinanceSchedulerService,
    FinanceAdminGuard,
    FinanceCampaignGuard,
    ResidentAppReceiptStorageService,
    MonthlyFinancialReportRepository,
    MonthlyFinancialReportService,
    FinancialEvidenceStorageService,
    MonthlyReportAdminGuard,
  ],
  exports: [
    FeeConfigurationService,
    FeeConfigurationRepository,
    BillingEngineService,
    BillingEngineRepository,
    MonthlyFinancialReportService,
  ],
})
export class FinanceModule {}
