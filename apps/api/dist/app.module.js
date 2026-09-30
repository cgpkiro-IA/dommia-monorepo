"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_module_1 = require("./database/database.module");
const tenants_module_1 = require("./modules/tenants/tenants.module");
const properties_module_1 = require("./modules/properties/properties.module");
const residents_module_1 = require("./modules/residents/residents.module");
const vehicles_module_1 = require("./modules/vehicles/vehicles.module");
const auth_module_1 = require("./modules/auth/auth.module");
const crm_module_1 = require("./modules/crm/crm.module");
const health_module_1 = require("./modules/health/health.module");
const notices_module_1 = require("./modules/notices/notices.module");
const finance_module_1 = require("./modules/finance/finance.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const stripe_module_1 = require("./modules/stripe/stripe.module");
const access_module_1 = require("./modules/access/access.module");
const deliveries_module_1 = require("./modules/deliveries/deliveries.module");
const guard_operations_module_1 = require("./modules/guard-operations/guard-operations.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env.local', '.env'],
            }),
            database_module_1.DatabaseModule,
            tenants_module_1.TenantsModule,
            properties_module_1.PropertiesModule,
            residents_module_1.ResidentsModule,
            vehicles_module_1.VehiclesModule,
            auth_module_1.AuthModule,
            crm_module_1.CrmModule,
            health_module_1.HealthModule,
            notices_module_1.NoticesModule,
            finance_module_1.FinanceModule,
            notifications_module_1.NotificationsModule,
            stripe_module_1.StripeModule,
            access_module_1.AccessModule,
            deliveries_module_1.DeliveriesModule,
            guard_operations_module_1.GuardOperationsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map