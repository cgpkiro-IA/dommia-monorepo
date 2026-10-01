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
exports.TenantsController = void 0;
const common_1 = require("@nestjs/common");
const tenants_service_1 = require("../services/tenants.service");
const create_tenant_dto_1 = require("../dto/create-tenant.dto");
const update_tenant_dto_1 = require("../dto/update-tenant.dto");
const crm_admin_guard_1 = require("../../auth/guards/crm-admin.guard");
const auth_metadata_decorator_1 = require("../../auth/decorators/auth-metadata.decorator");
let TenantsController = class TenantsController {
    tenantsService;
    constructor(tenantsService) {
        this.tenantsService = tenantsService;
    }
    async findAll() {
        const tenants = await this.tenantsService.findAll();
        return {
            success: true,
            data: tenants,
            count: tenants.length,
        };
    }
    async findOne(slug) {
        const tenant = await this.tenantsService.findBySlug(slug);
        return {
            success: true,
            data: tenant,
        };
    }
    async create(dto) {
        const result = await this.tenantsService.create(dto);
        return {
            success: true,
            message: `Fraccionamiento "${dto.name}" aprovisionado exitosamente con schema "${result.schema}".`,
            data: result,
        };
    }
    async update(slug, dto) {
        const updated = await this.tenantsService.update(slug, dto);
        return {
            success: true,
            message: `Fraccionamiento "${updated?.name || slug}" actualizado exitosamente.`,
            data: updated,
        };
    }
    async patch(slug, dto) {
        const updated = await this.tenantsService.update(slug, dto);
        return {
            success: true,
            message: `Fraccionamiento "${updated?.name || slug}" actualizado exitosamente.`,
            data: updated,
        };
    }
};
exports.TenantsController = TenantsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(crm_admin_guard_1.CrmAdminGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':slug'),
    (0, auth_metadata_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(crm_admin_guard_1.CrmAdminGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_tenant_dto_1.CreateTenantDto]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':slug'),
    (0, common_1.UseGuards)(crm_admin_guard_1.CrmAdminGuard),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_tenant_dto_1.UpdateTenantDto]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':slug'),
    (0, common_1.UseGuards)(crm_admin_guard_1.CrmAdminGuard),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_tenant_dto_1.UpdateTenantDto]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "patch", null);
exports.TenantsController = TenantsController = __decorate([
    (0, common_1.Controller)('tenants'),
    (0, auth_metadata_decorator_1.Roles)('SUPER_ADMIN', 'COMMERCIAL_EXEC', 'SUPPORT'),
    __metadata("design:paramtypes", [tenants_service_1.TenantsService])
], TenantsController);
//# sourceMappingURL=tenants.controller.js.map