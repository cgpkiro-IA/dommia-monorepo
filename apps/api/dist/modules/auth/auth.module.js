"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../database/database.module");
const auth_controller_1 = require("./controllers/auth.controller");
const resident_app_auth_controller_1 = require("./controllers/resident-app-auth.controller");
const resident_app_devices_controller_1 = require("./controllers/resident-app-devices.controller");
const auth_service_1 = require("./services/auth.service");
const auth_repository_1 = require("./repositories/auth.repository");
const resident_auth_guard_1 = require("./guards/resident-auth.guard");
const admin_session_guard_1 = require("./guards/admin-session.guard");
const crm_admin_guard_1 = require("./guards/crm-admin.guard");
const notifications_module_1 = require("../notifications/notifications.module");
const resident_rate_limiter_1 = require("./services/resident-rate-limiter");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, notifications_module_1.NotificationsModule],
        controllers: [auth_controller_1.AuthController, resident_app_auth_controller_1.ResidentAppAuthController, resident_app_devices_controller_1.ResidentAppDevicesController],
        providers: [auth_service_1.AuthService, auth_repository_1.AuthRepository, resident_rate_limiter_1.InMemoryResidentRateLimiter, resident_auth_guard_1.ResidentAuthGuard, resident_auth_guard_1.ResidentAppAuthGuard, admin_session_guard_1.AdminSessionGuard, crm_admin_guard_1.CrmAdminGuard],
        exports: [auth_service_1.AuthService, auth_repository_1.AuthRepository, resident_auth_guard_1.ResidentAuthGuard, resident_auth_guard_1.ResidentAppAuthGuard, admin_session_guard_1.AdminSessionGuard, crm_admin_guard_1.CrmAdminGuard],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map