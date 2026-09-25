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
exports.CrmController = void 0;
const common_1 = require("@nestjs/common");
const crm_service_1 = require("../services/crm.service");
const create_prospect_dto_1 = require("../dto/create-prospect.dto");
const update_stage_dto_1 = require("../dto/update-stage.dto");
const create_gateway_dto_1 = require("../dto/create-gateway.dto");
const self_service_provision_dto_1 = require("../dto/self-service-provision.dto");
const update_plan_dto_1 = require("../dto/update-plan.dto");
let CrmController = class CrmController {
    crmService;
    constructor(crmService) {
        this.crmService = crmService;
    }
    async getPlans() {
        const plans = await this.crmService.getPlans();
        return {
            success: true,
            data: plans,
            count: plans.length,
        };
    }
    async updatePlan(id, dto) {
        const updated = await this.crmService.updatePlan(id, dto);
        return {
            success: true,
            message: `Plan "${updated.name}" actualizado exitosamente`,
            data: updated,
        };
    }
    async getMetrics() {
        const metrics = await this.crmService.getMetrics();
        return {
            success: true,
            data: metrics,
        };
    }
    async selfServiceProvision(dto) {
        const result = await this.crmService.selfServiceProvision(dto);
        return {
            success: true,
            message: `¡Comunidad "${result.communityName}" activada y aprovisionada exitosamente en el plan ${result.tier}!`,
            data: result,
        };
    }
    async createProspect(dto) {
        const prospect = await this.crmService.createProspect(dto);
        return {
            success: true,
            message: '¡Gracias por tu interés! Un asesor comercial de Dommia se pondrá en contacto contigo.',
            data: prospect,
        };
    }
    async getProspects() {
        const prospects = await this.crmService.findAllProspects();
        return {
            success: true,
            data: prospects,
            count: prospects.length,
        };
    }
    async updateStage(id, dto) {
        const updated = await this.crmService.updateProspectStage(id, dto);
        return {
            success: true,
            message: `Etapa actualizada a ${dto.stage}`,
            data: updated,
        };
    }
    async getGateways() {
        const gateways = await this.crmService.findAllGateways();
        return {
            success: true,
            data: gateways,
            count: gateways.length,
        };
    }
    async registerGateway(dto) {
        const gateway = await this.crmService.registerGateway(dto);
        return {
            success: true,
            message: 'Gateway registrado exitosamente en el inventario IoT',
            data: gateway,
        };
    }
    async recordHeartbeat(uuid, body) {
        const gateway = await this.crmService.recordHeartbeat(uuid, body.ipLocal);
        return {
            success: true,
            message: 'Heartbeat registrado',
            data: gateway,
        };
    }
    async updateGateway(uuid, body) {
        const gateway = await this.crmService.updateGateway(uuid, body);
        return {
            success: true,
            message: 'Gateway actualizado exitosamente',
            data: gateway,
        };
    }
};
exports.CrmController = CrmController;
__decorate([
    (0, common_1.Get)('plans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "getPlans", null);
__decorate([
    (0, common_1.Put)('plans/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_plan_dto_1.UpdatePlanDto]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Get)('metrics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Post)('self-service-provision'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [self_service_provision_dto_1.SelfServiceProvisionDto]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "selfServiceProvision", null);
__decorate([
    (0, common_1.Post)('prospects'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_prospect_dto_1.CreateProspectDto]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "createProspect", null);
__decorate([
    (0, common_1.Get)('prospects'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "getProspects", null);
__decorate([
    (0, common_1.Patch)('prospects/:id/stage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_stage_dto_1.UpdateStageDto]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "updateStage", null);
__decorate([
    (0, common_1.Get)('gateways'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "getGateways", null);
__decorate([
    (0, common_1.Post)('gateways'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_gateway_dto_1.CreateGatewayDto]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "registerGateway", null);
__decorate([
    (0, common_1.Post)('gateways/:uuid/heartbeat'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('uuid')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "recordHeartbeat", null);
__decorate([
    (0, common_1.Put)('gateways/:uuid'),
    __param(0, (0, common_1.Param)('uuid')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "updateGateway", null);
exports.CrmController = CrmController = __decorate([
    (0, common_1.Controller)('crm'),
    __metadata("design:paramtypes", [crm_service_1.CrmService])
], CrmController);
//# sourceMappingURL=crm.controller.js.map