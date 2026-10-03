"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmModule = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const database_module_1 = require("../../database/database.module");
const tenants_module_1 = require("../tenants/tenants.module");
const crm_controller_1 = require("./controllers/crm.controller");
const crm_service_1 = require("./services/crm.service");
const crm_repository_1 = require("./repositories/crm.repository");
const telegram_alert_service_1 = require("./services/telegram-alert.service");
const crm_alerts_service_1 = require("./services/crm-alerts.service");
const crm_analytics_service_1 = require("./services/crm-analytics.service");
const auth_module_1 = require("../auth/auth.module");
const saas_mail_service_1 = require("./services/saas-mail.service");
let CrmModule = class CrmModule {
};
exports.CrmModule = CrmModule;
exports.CrmModule = CrmModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, tenants_module_1.TenantsModule, auth_module_1.AuthModule, throttler_1.ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }])],
        controllers: [crm_controller_1.CrmController],
        providers: [
            crm_service_1.CrmService,
            crm_repository_1.CrmRepository,
            saas_mail_service_1.SaasMailService,
            telegram_alert_service_1.TelegramAlertService,
            crm_alerts_service_1.CrmAlertsService,
            crm_analytics_service_1.CrmAnalyticsService,
        ],
        exports: [
            crm_service_1.CrmService,
            crm_repository_1.CrmRepository,
            telegram_alert_service_1.TelegramAlertService,
            crm_alerts_service_1.CrmAlertsService,
            crm_analytics_service_1.CrmAnalyticsService,
        ],
    })
], CrmModule);
//# sourceMappingURL=crm.module.js.map