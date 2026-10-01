"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../database/database.module");
const tenants_module_1 = require("../tenants/tenants.module");
const notices_module_1 = require("../notices/notices.module");
const fee_configuration_controller_1 = require("./controllers/fee-configuration.controller");
const fee_configuration_service_1 = require("./services/fee-configuration.service");
const fee_configuration_repository_1 = require("./repositories/fee-configuration.repository");
const billing_engine_controller_1 = require("./controllers/billing-engine.controller");
const billing_engine_service_1 = require("./services/billing-engine.service");
const billing_engine_repository_1 = require("./repositories/billing-engine.repository");
const finance_scheduler_service_1 = require("./services/finance-scheduler.service");
const finance_admin_guard_1 = require("../auth/guards/finance-admin.guard");
const auth_module_1 = require("../auth/auth.module");
const resident_app_finance_controller_1 = require("./controllers/resident-app-finance.controller");
const resident_app_receipt_storage_service_1 = require("./services/resident-app-receipt-storage.service");
const finance_campaign_guard_1 = require("./guards/finance-campaign.guard");
const monthly_financial_report_controller_1 = require("./controllers/monthly-financial-report.controller");
const resident_monthly_financial_report_controller_1 = require("./controllers/resident-monthly-financial-report.controller");
const resident_app_monthly_financial_report_controller_1 = require("./controllers/resident-app-monthly-financial-report.controller");
const monthly_financial_report_repository_1 = require("./repositories/monthly-financial-report.repository");
const monthly_financial_report_service_1 = require("./services/monthly-financial-report.service");
const financial_evidence_storage_service_1 = require("./services/financial-evidence-storage.service");
const monthly_report_admin_guard_1 = require("./guards/monthly-report-admin.guard");
let FinanceModule = class FinanceModule {
};
exports.FinanceModule = FinanceModule;
exports.FinanceModule = FinanceModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, tenants_module_1.TenantsModule, notices_module_1.NoticesModule, auth_module_1.AuthModule],
        controllers: [
            fee_configuration_controller_1.FeeConfigurationController,
            billing_engine_controller_1.BillingEngineController,
            resident_app_finance_controller_1.ResidentAppFinanceController,
            monthly_financial_report_controller_1.MonthlyFinancialReportController,
            resident_monthly_financial_report_controller_1.ResidentMonthlyFinancialReportController,
            resident_app_monthly_financial_report_controller_1.ResidentAppMonthlyFinancialReportController,
        ],
        providers: [
            fee_configuration_service_1.FeeConfigurationService,
            fee_configuration_repository_1.FeeConfigurationRepository,
            billing_engine_service_1.BillingEngineService,
            billing_engine_repository_1.BillingEngineRepository,
            finance_scheduler_service_1.FinanceSchedulerService,
            finance_admin_guard_1.FinanceAdminGuard,
            finance_campaign_guard_1.FinanceCampaignGuard,
            resident_app_receipt_storage_service_1.ResidentAppReceiptStorageService,
            monthly_financial_report_repository_1.MonthlyFinancialReportRepository,
            monthly_financial_report_service_1.MonthlyFinancialReportService,
            financial_evidence_storage_service_1.FinancialEvidenceStorageService,
            monthly_report_admin_guard_1.MonthlyReportAdminGuard,
        ],
        exports: [
            fee_configuration_service_1.FeeConfigurationService,
            fee_configuration_repository_1.FeeConfigurationRepository,
            billing_engine_service_1.BillingEngineService,
            billing_engine_repository_1.BillingEngineRepository,
            monthly_financial_report_service_1.MonthlyFinancialReportService,
        ],
    })
], FinanceModule);
//# sourceMappingURL=finance.module.js.map