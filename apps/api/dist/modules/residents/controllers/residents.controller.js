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
exports.ResidentsController = void 0;
const common_1 = require("@nestjs/common");
const residents_service_1 = require("../services/residents.service");
const resident_dto_1 = require("../dto/resident.dto");
let ResidentsController = class ResidentsController {
    residentsService;
    constructor(residentsService) {
        this.residentsService = residentsService;
    }
    async getResidents(slug, propertyId) {
        const residents = await this.residentsService.getTenantResidents(slug, propertyId);
        return {
            success: true,
            data: residents,
            count: residents.length,
        };
    }
    async createResident(slug, dto) {
        const resident = await this.residentsService.createTenantResident(slug, dto);
        return {
            success: true,
            message: `Residente "${resident.first_name} ${resident.last_name}" registrado exitosamente.`,
            data: resident,
        };
    }
    async updateResident(slug, id, dto) {
        const resident = await this.residentsService.updateTenantResident(slug, id, dto);
        return {
            success: true,
            message: 'Residente actualizado exitosamente.',
            data: resident,
        };
    }
    async deleteResident(slug, id) {
        const result = await this.residentsService.deleteTenantResident(slug, id);
        return {
            success: true,
            message: result.message,
        };
    }
};
exports.ResidentsController = ResidentsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)('propertyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ResidentsController.prototype, "getResidents", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, resident_dto_1.CreateResidentDto]),
    __metadata("design:returntype", Promise)
], ResidentsController.prototype, "createResident", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, resident_dto_1.UpdateResidentDto]),
    __metadata("design:returntype", Promise)
], ResidentsController.prototype, "updateResident", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ResidentsController.prototype, "deleteResident", null);
exports.ResidentsController = ResidentsController = __decorate([
    (0, common_1.Controller)('tenants/:slug/residents'),
    __metadata("design:paramtypes", [residents_service_1.ResidentsService])
], ResidentsController);
//# sourceMappingURL=residents.controller.js.map