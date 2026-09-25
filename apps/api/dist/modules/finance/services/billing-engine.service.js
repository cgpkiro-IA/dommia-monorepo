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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingEngineService = void 0;
const common_1 = require("@nestjs/common");
const billing_engine_repository_1 = require("../repositories/billing-engine.repository");
const tenants_repository_1 = require("../../tenants/repositories/tenants.repository");
const notices_repository_1 = require("../../notices/repositories/notices.repository");
let BillingEngineService = class BillingEngineService {
    billingRepo;
    tenantsRepo;
    noticesRepo;
    constructor(billingRepo, tenantsRepo, noticesRepo) {
        this.billingRepo = billingRepo;
        this.tenantsRepo = tenantsRepo;
        this.noticesRepo = noticesRepo;
    }
    async validateTenant(slug) {
        const tenant = await this.tenantsRepo.findBySlug(slug);
        if (!tenant) {
            throw new common_1.NotFoundException(`Fraccionamiento con slug "${slug}" no encontrado.`);
        }
        return tenant;
    }
    async generateMonthlyCharges(slug, dto) {
        const tenant = await this.validateTenant(slug);
        const now = new Date();
        const year = dto.year || now.getFullYear();
        const month = dto.month || now.getMonth() + 1;
        const dryRun = dto.dryRun ?? false;
        const result = await this.billingRepo.generateMonthlyCharges(tenant.slug, year, month, dryRun);
        return {
            success: true,
            message: dryRun
                ? `Simulación de corte: Se proyectan ${result.chargesCount} cargos por un total de $${result.totalProjectedAmount.toLocaleString('es-MX')}.`
                : `Emisión de cobranza completada: Se generaron ${result.chargesCount} nuevos cargos para el período ${result.monthName} ${year}.`,
            data: result,
        };
    }
    async getCharges(slug, filters) {
        const tenant = await this.validateTenant(slug);
        const charges = await this.billingRepo.findAllCharges(tenant.slug, filters);
        return {
            success: true,
            data: charges,
            count: charges.length,
        };
    }
    async recordPayment(slug, dto) {
        const tenant = await this.validateTenant(slug);
        if (dto.amount <= 0) {
            throw new common_1.BadRequestException('El monto debe ser mayor a $0.00 MXN.');
        }
        const result = await this.billingRepo.recordPayment(tenant.slug, dto);
        if (!result) {
            throw new common_1.NotFoundException('La propiedad especificada no existe en este fraccionamiento.');
        }
        const methodLabels = {
            CASH: 'Efectivo en Ventanilla',
            SPEI_TRANSFER: 'Transferencia SPEI',
            BANK_DEPOSIT: 'Depósito Bancario',
            STRIPE_CARD: 'Tarjeta de Crédito / Débito',
        };
        const methodText = methodLabels[dto.paymentMethod || 'CASH'] || dto.paymentMethod;
        try {
            await this.noticesRepo.create(tenant.slug, {
                title: `🧾 Recibo Acreditado: ${result.payment.reference} (${result.propertyAddress})`,
                content: `Se ha registrado y acreditado con éxito el pago por $${Number(dto.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN mediante ${methodText}. Folio interno: ${result.payment.reference}. Estado de vivienda: ${result.isDelinquent ? 'Adeudo pendiente' : 'Al Corriente'}.`,
                category: 'GENERAL',
                priority: 'MEDIUM',
                authorName: dto.receivedByName || 'Administración',
                isPinned: false,
                isPublished: true,
            });
        }
        catch (err) {
            console.warn('Notice creation on payment skipped:', err);
        }
        return {
            success: true,
            message: `¡Pago de $${Number(dto.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} registrado y acreditado correctamente! Folio: ${result.payment.reference}`,
            data: result,
        };
    }
    async getPayments(slug, filters) {
        const tenant = await this.validateTenant(slug);
        const payments = await this.billingRepo.findAllPayments(tenant.slug, filters);
        return {
            success: true,
            data: payments,
            count: payments.length,
        };
    }
    async getPropertyStatus(slug, propertyId) {
        const tenant = await this.validateTenant(slug);
        const status = await this.billingRepo.getPropertyFinancialStatus(tenant.slug, propertyId);
        return {
            success: true,
            data: status,
        };
    }
    async getSummary(slug) {
        const tenant = await this.validateTenant(slug);
        const summary = await this.billingRepo.getFinancialSummary(tenant.slug);
        return {
            success: true,
            data: summary.summary,
        };
    }
};
exports.BillingEngineService = BillingEngineService;
exports.BillingEngineService = BillingEngineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [billing_engine_repository_1.BillingEngineRepository,
        tenants_repository_1.TenantsRepository,
        notices_repository_1.NoticesRepository])
], BillingEngineService);
//# sourceMappingURL=billing-engine.service.js.map