"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResidentsModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../database/database.module");
const tenants_module_1 = require("../tenants/tenants.module");
const residents_controller_1 = require("./controllers/residents.controller");
const residents_service_1 = require("./services/residents.service");
const residents_repository_1 = require("./repositories/residents.repository");
const auth_module_1 = require("../auth/auth.module");
const notifications_module_1 = require("../notifications/notifications.module");
const finance_admin_guard_1 = require("../auth/guards/finance-admin.guard");
let ResidentsModule = class ResidentsModule {
};
exports.ResidentsModule = ResidentsModule;
exports.ResidentsModule = ResidentsModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, tenants_module_1.TenantsModule, auth_module_1.AuthModule, notifications_module_1.NotificationsModule],
        controllers: [residents_controller_1.ResidentsController],
        providers: [residents_service_1.ResidentsService, residents_repository_1.ResidentsRepository, finance_admin_guard_1.FinanceAdminGuard],
        exports: [residents_service_1.ResidentsService, residents_repository_1.ResidentsRepository],
    })
], ResidentsModule);
//# sourceMappingURL=residents.module.js.map