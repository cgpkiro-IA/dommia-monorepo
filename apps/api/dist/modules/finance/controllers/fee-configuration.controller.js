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
exports.FeeConfigurationController = void 0;
const common_1 = require("@nestjs/common");
const fee_configuration_service_1 = require("../services/fee-configuration.service");
const fee_configuration_dto_1 = require("../dto/fee-configuration.dto");
const finance_admin_guard_1 = require("../../auth/guards/finance-admin.guard");
const auth_metadata_decorator_1 = require("../../auth/decorators/auth-metadata.decorator");
let FeeConfigurationController = class FeeConfigurationController {
    feeService;
    constructor(feeService) {
        this.feeService = feeService;
    }
    async getFees(slug, activeOnly) {
        const isActiveOnly = activeOnly === 'true';
        const fees = await this.feeService.getFees(slug, isActiveOnly);
        return {
            success: true,
            data: fees,
            count: fees.length,
        };
    }
    async getFeeById(slug, id) {
        const fee = await this.feeService.getFeeById(slug, id);
        return {
            success: true,
            data: fee,
        };
    }
    async createFee(slug, dto) {
        const fee = await this.feeService.createFee(slug, dto);
        return {
            success: true,
            message: `Estructura de cuota "${fee.name}" configurada exitosamente.`,
            data: fee,
        };
    }
    async updateFee(slug, id, dto) {
        const fee = await this.feeService.updateFee(slug, id, dto);
        return {
            success: true,
            message: 'Configuración de cuota actualizada exitosamente.',
            data: fee,
        };
    }
    async deleteFee(slug, id) {
        const deleted = await this.feeService.deleteFee(slug, id);
        return {
            success: true,
            message: deleted ? 'Estructura de cuota eliminada exitosamente.' : 'No se pudo eliminar la cuota.',
        };
    }
    async simulateFee(slug, id) {
        const simulation = await this.feeService.simulateFee(slug, id);
        return {
            success: true,
            message: 'Simulación de cobro proyectado calculada exitosamente.',
            data: simulation,
        };
    }
};
exports.FeeConfigurationController = FeeConfigurationController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)('activeOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FeeConfigurationController.prototype, "getFees", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FeeConfigurationController.prototype, "getFeeById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, fee_configuration_dto_1.CreateFeeConfigurationDto]),
    __metadata("design:returntype", Promise)
], FeeConfigurationController.prototype, "createFee", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, fee_configuration_dto_1.UpdateFeeConfigurationDto]),
    __metadata("design:returntype", Promise)
], FeeConfigurationController.prototype, "updateFee", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FeeConfigurationController.prototype, "deleteFee", null);
__decorate([
    (0, common_1.Post)(':id/simulate'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FeeConfigurationController.prototype, "simulateFee", null);
exports.FeeConfigurationController = FeeConfigurationController = __decorate([
    (0, common_1.Controller)('tenants/:slug/finance/fees'),
    (0, common_1.UseGuards)(finance_admin_guard_1.FinanceAdminGuard),
    (0, auth_metadata_decorator_1.Roles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR'),
    __metadata("design:paramtypes", [fee_configuration_service_1.FeeConfigurationService])
], FeeConfigurationController);
//# sourceMappingURL=fee-configuration.controller.js.map