"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../services/auth.service");
const login_dto_1 = require("../dto/login.dto");
const admin_mfa_dto_1 = require("../dto/admin-mfa.dto");
const resident_auth_dto_1 = require("../dto/resident-auth.dto");
const resident_auth_guard_1 = require("../guards/resident-auth.guard");
const admin_session_guard_1 = require("../guards/admin-session.guard");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async login(dto) {
        const session = await this.authService.login(dto);
        return {
            success: true,
            message: 'Autenticación exitosa',
            data: session,
        };
    }
    async verifyMfaLogin(dto) {
        return {
            success: true,
            message: 'Autenticación de dos pasos exitosa',
            data: await this.authService.verifyMfaLogin(dto.challengeToken, dto.code),
        };
    }
    async mfaStatus(request) {
        return { success: true, data: await this.authService.getMfaStatus(request.user.sub) };
    }
    async startMfaSetup(request, dto) {
        return { success: true, data: await this.authService.startMfaSetup(request.user.sub, dto.password) };
    }
    async enableMfa(request, dto) {
        return { success: true, data: await this.authService.enableMfa(request.user.sub, dto.code) };
    }
    async disableMfa(request, dto) {
        return { success: true, data: await this.authService.disableMfa(request.user.sub, dto.password, dto.code) };
    }
    async selectTenant(request, dto) {
        return { success: true, data: await this.authService.selectTenant(request.user.sub, dto.tenantSlug) };
    }
    async residentLogin(dto) {
        return { success: true, message: 'Autenticación Resident exitosa', data: await this.authService.residentLogin(dto) };
    }
    async residentActivate(dto) {
        return this.authService.activateResident(dto);
    }
    async residentProfile(request) {
        return { success: true, data: await this.authService.residentProfile(request.user.tenantSlug, request.user.sub) };
    }
    async residentLogout(request) {
        return this.authService.residentLogout(request.user.jti);
    }
    async residentChangePassword(dto) {
        return this.authService.changeResidentPassword(dto);
    }
    async residentPasswordRecovery(dto) {
        return this.authService.requestResidentPasswordRecovery(dto);
    }
    async residentPasswordReset(dto) {
        return this.authService.resetResidentPassword(dto);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('mfa/verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_mfa_dto_1.VerifyMfaLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyMfaLogin", null);
__decorate([
    (0, common_1.Get)('mfa/status'),
    (0, common_1.UseGuards)(admin_session_guard_1.AdminSessionGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "mfaStatus", null);
__decorate([
    (0, common_1.Post)('mfa/setup'),
    (0, common_1.UseGuards)(admin_session_guard_1.AdminSessionGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_mfa_dto_1.StartMfaSetupDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "startMfaSetup", null);
__decorate([
    (0, common_1.Post)('mfa/enable'),
    (0, common_1.UseGuards)(admin_session_guard_1.AdminSessionGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_mfa_dto_1.MfaCodeDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "enableMfa", null);
__decorate([
    (0, common_1.Post)('mfa/disable'),
    (0, common_1.UseGuards)(admin_session_guard_1.AdminSessionGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_mfa_dto_1.DisableMfaDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "disableMfa", null);
__decorate([
    (0, common_1.Post)('select-tenant'),
    (0, common_1.UseGuards)(admin_session_guard_1.AdminSessionGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_mfa_dto_1.SelectTenantDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "selectTenant", null);
__decorate([
    (0, common_1.Post)('resident/login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [resident_auth_dto_1.ResidentLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "residentLogin", null);
__decorate([
    (0, common_1.Post)('resident/activate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [resident_auth_dto_1.ResidentActivateDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "residentActivate", null);
__decorate([
    (0, common_1.Get)('resident/me'),
    (0, common_1.UseGuards)(resident_auth_guard_1.ResidentAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "residentProfile", null);
__decorate([
    (0, common_1.Post)('resident/logout'),
    (0, common_1.UseGuards)(resident_auth_guard_1.ResidentAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "residentLogout", null);
__decorate([
    (0, common_1.Post)('resident/change-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [resident_auth_dto_1.ResidentChangePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "residentChangePassword", null);
__decorate([
    (0, common_1.Post)('resident/password-recovery'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [resident_auth_dto_1.ResidentPasswordRecoveryRequestDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "residentPasswordRecovery", null);
__decorate([
    (0, common_1.Post)('resident/password-reset'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [resident_auth_dto_1.ResidentPasswordResetDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "residentPasswordReset", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map