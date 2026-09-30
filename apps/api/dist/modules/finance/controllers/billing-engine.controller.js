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
const common_2 = require("@nestjs/common");
const finance_admin_guard_1 = require("../../auth/guards/finance-admin.guard");
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
    async submitSpeiPayment(slug, dto) {
        return this.billingService.submitSpeiPayment(slug, dto);
    }
    async reviewPayment(slug, id, dto) {
        return this.billingService.reviewPayment(slug, id, dto);
    }
    async getPropertyStatus(slug, propertyId) {
        return this.billingService.getPropertyStatus(slug, propertyId);
    }
    async getSummary(slug) {
        return this.billingService.getSummary(slug);
    }
    async listAnnualCampaigns(slug) {
        return this.billingService.listAnnualCampaigns(slug);
    }
    async createAnnualCampaign(slug, dto) {
        return this.billingService.createAnnualCampaign(slug, dto);
    }
    async getAnnualCampaignQuote(slug, campaignId, dto) {
        return this.billingService.getAnnualCampaignQuote(slug, campaignId, dto);
    }
    async submitAnnualPayment(slug, campaignId, dto) {
        return this.billingService.submitAnnualPayment(slug, campaignId, dto, 'SPEI_TRANSFER');
    }
    async recordAnnualCashPayment(slug, campaignId, dto) {
        return this.billingService.submitAnnualPayment(slug, campaignId, dto, 'CASH');
    }
    async listAnnualCommitments(slug, campaignId) {
        return this.billingService.listAnnualCommitments(slug, campaignId);
    }
    async reviewAnnualCommitment(slug, id, dto) {
        return this.billingService.reviewAnnualCommitment(slug, id, dto);
    }
};
exports.BillingEngineController = BillingEngineController;
__decorate([
    (0, common_1.Post)('billing/generate'),
    (0, common_2.UseGuards)(finance_admin_guard_1.FinanceAdminGuard),
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
    (0, common_2.UseGuards)(finance_admin_guard_1.FinanceAdminGuard),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, financial_operations_dto_1.CreatePaymentDto]),
    __metadata("design:returntype", Promise)
], BillingEngineController.prototype, "recordPayment", null);
__decorate([
    (0, common_1.Post)('payments/cash'),
    (0, common_2.UseGuards)(finance_admin_guard_1.FinanceAdminGuard),
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
    (0, common_1.Post)('payments/spei-submissions'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, financial_operations_dto_1.SubmitSpeiPaymentDto]),
    __metadata("design:returntype", Promise)
], BillingEngineController.prototype, "submitSpeiPayment", null);
__decorate([
    (0, common_1.Patch)('payments/:id/review'),
    (0, common_2.UseGuards)(finance_admin_guard_1.FinanceAdminGuard),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, financial_operations_dto_1.ReviewPaymentDto]),
    __metadata("design:returntype", Promise)
], BillingEngineController.prototype, "reviewPayment", null);
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
__decorate([
    (0, common_1.Get)('annual-campaigns'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingEngineController.prototype, "listAnnualCampaigns", null);
__decorate([
    (0, common_1.Post)('annual-campaigns'),
    (0, common_2.UseGuards)(finance_admin_guard_1.FinanceAdminGuard),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, financial_operations_dto_1.CreateAnnualCampaignDto]),
    __metadata("design:returntype", Promise)
], BillingEngineController.prototype, "createAnnualCampaign", null);
__decorate([
    (0, common_1.Post)('annual-campaigns/:campaignId/quote'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('campaignId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, financial_operations_dto_1.AnnualCampaignQuoteDto]),
    __metadata("design:returntype", Promise)
], BillingEngineController.prototype, "getAnnualCampaignQuote", null);
__decorate([
    (0, common_1.Post)('annual-campaigns/:campaignId/submissions'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('campaignId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, financial_operations_dto_1.SubmitAnnualPaymentDto]),
    __metadata("design:returntype", Promise)
], BillingEngineController.prototype, "submitAnnualPayment", null);
__decorate([
    (0, common_1.Post)('annual-campaigns/:campaignId/cash'),
    (0, common_2.UseGuards)(finance_admin_guard_1.FinanceAdminGuard),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('campaignId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, financial_operations_dto_1.SubmitAnnualPaymentDto]),
    __metadata("design:returntype", Promise)
], BillingEngineController.prototype, "recordAnnualCashPayment", null);
__decorate([
    (0, common_1.Get)('annual-campaigns/:campaignId/commitments'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('campaignId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BillingEngineController.prototype, "listAnnualCommitments", null);
__decorate([
    (0, common_1.Patch)('annual-commitments/:id/review'),
    (0, common_2.UseGuards)(finance_admin_guard_1.FinanceAdminGuard),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, financial_operations_dto_1.ReviewPaymentDto]),
    __metadata("design:returntype", Promise)
], BillingEngineController.prototype, "reviewAnnualCommitment", null);
exports.BillingEngineController = BillingEngineController = __decorate([
    (0, common_1.Controller)('tenants/:slug/finance'),
    __metadata("design:paramtypes", [billing_engine_service_1.BillingEngineService])
], BillingEngineController);
//# sourceMappingURL=billing-engine.controller.js.map