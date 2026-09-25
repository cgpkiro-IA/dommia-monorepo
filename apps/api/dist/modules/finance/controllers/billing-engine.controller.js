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
exports.BillingEngineController = void 0;
const common_1 = require("@nestjs/common");
const billing_engine_service_1 = require("../services/billing-engine.service");
const financial_operations_dto_1 = require("../dto/financial-operations.dto");
let BillingEngineController = class BillingEngineController {
    billingService;
    constructor(billingService) {
        this.billingService = billingService;
    }
    async generateMonthlyBilling(slug, dto) {
        return this.billingService.generateMonthlyCharges(slug, dto);
    }
    async getCharges(slug, query) {
        return this.billingService.getCharges(slug, query);
    }
    async recordPayment(slug, dto) {
        return this.billingService.recordPayment(slug, dto);
    }
    async recordCashPayment(slug, dto) {
        return this.billingService.recordPayment(slug, dto);
    }
    async getPayments(slug, query) {
        return this.billingService.getPayments(slug, query);
    }
    async getPropertyStatus(slug, propertyId) {
        return this.billingService.getPropertyStatus(slug, propertyId);
    }
    async getSummary(slug) {
        return this.billingService.getSummary(slug);
    }
};
exports.BillingEngineController = BillingEngineController;
__decorate([
    (0, common_1.Post)('billing/generate'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, financial_operations_dto_1.GenerateMonthlyChargesDto]),
    __metadata("design:returntype", Promise)
], BillingEngineController.prototype, "generateMonthlyBilling", null);
__decorate([
    (0, common_1.Get)('charges'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, financial_operations_dto_1.QueryChargesDto]),
    __metadata("design:returntype", Promise)
], BillingEngineController.prototype, "getCharges", null);
__decorate([
    (0, common_1.Post)('payments'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, financial_operations_dto_1.CreatePaymentDto]),
    __metadata("design:returntype", Promise)
], BillingEngineController.prototype, "recordPayment", null);
__decorate([
    (0, common_1.Post)('payments/cash'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, financial_operations_dto_1.CreatePaymentDto]),
    __metadata("design:returntype", Promise)
], BillingEngineController.prototype, "recordCashPayment", null);
__decorate([
    (0, common_1.Get)('payments'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, financial_operations_dto_1.QueryPaymentsDto]),
    __metadata("design:returntype", Promise)
], BillingEngineController.prototype, "getPayments", null);
__decorate([
    (0, common_1.Get)('properties/:propertyId/status'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('propertyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BillingEngineController.prototype, "getPropertyStatus", null);
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingEngineController.prototype, "getSummary", null);
exports.BillingEngineController = BillingEngineController = __decorate([
    (0, common_1.Controller)('tenants/:slug/finance'),
    __metadata("design:paramtypes", [billing_engine_service_1.BillingEngineService])
], BillingEngineController);
//# sourceMappingURL=billing-engine.controller.js.map