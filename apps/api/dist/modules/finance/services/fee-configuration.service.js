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
exports.FeeConfigurationService = void 0;
const common_1 = require("@nestjs/common");
const fee_configuration_repository_1 = require("../repositories/fee-configuration.repository");
const tenants_service_1 = require("../../tenants/services/tenants.service");
let FeeConfigurationService = class FeeConfigurationService {
    feeRepo;
    tenantsService;
    constructor(feeRepo, tenantsService) {
        this.feeRepo = feeRepo;
        this.tenantsService = tenantsService;
    }
    async validateTenant(slug) {
        const tenant = await this.tenantsService.findBySlug(slug);
        if (!tenant) {
            throw new common_1.NotFoundException(`Fraccionamiento con slug "${slug}" no encontrado.`);
        }
        return tenant;
    }
    async getFees(slug, activeOnly = false) {
        await this.validateTenant(slug);
        return this.feeRepo.findAllByTenant(slug, activeOnly);
    }
    async getFeeById(slug, id) {
        await this.validateTenant(slug);
        const fee = await this.feeRepo.findById(slug, id);
        if (!fee) {
            throw new common_1.NotFoundException(`Configuración de cuota con ID "${id}" no encontrada.`);
        }
        return fee;
    }
    async createFee(slug, dto) {
        await this.validateTenant(slug);
        if (dto.baseAmount < 0) {
            throw new common_1.BadRequestException('El monto base no puede ser negativo.');
        }
        return this.feeRepo.create(slug, dto);
    }
    async updateFee(slug, id, dto) {
        await this.validateTenant(slug);
        await this.getFeeById(slug, id);
        return this.feeRepo.update(slug, id, dto);
    }
    async deleteFee(slug, id) {
        await this.validateTenant(slug);
        await this.getFeeById(slug, id);
        return this.feeRepo.delete(slug, id);
    }
    async simulateFee(slug, id) {
        await this.validateTenant(slug);
        const fee = await this.getFeeById(slug, id);
        const properties = await this.feeRepo.getPropertiesForSimulation(slug);
        let totalBaseRevenue = 0;
        let totalEarlyBirdRevenue = 0;
        let totalLateRevenue = 0;
        const propertyBreakdowns = properties.map((prop) => {
            let baseFee = Number(fee.base_amount || fee.baseAmount);
            if (fee.fee_type === 'VARIABLE_LOT_SIZE' || fee.feeType === 'VARIABLE_LOT_SIZE') {
                const lotM2 = Number(prop.lot_size_m2) || 150.0;
                baseFee = Number((baseFee * lotM2).toFixed(2));
            }
            let discountAmount = 0;
            const discountType = fee.early_bird_discount_type || fee.earlyBirdDiscountType;
            const discountVal = Number(fee.early_bird_discount_amount || fee.earlyBirdDiscountAmount || 0);
            if (discountType === 'PERCENTAGE') {
                discountAmount = Number(((baseFee * discountVal) / 100).toFixed(2));
            }
            else if (discountType === 'FIXED') {
                discountAmount = Math.min(baseFee, discountVal);
            }
            const earlyBirdTotal = Number((baseFee - discountAmount).toFixed(2));
            let surchargeAmount = 0;
            const lateType = fee.late_fee_type || fee.lateFeeType;
            const lateVal = Number(fee.late_fee_amount || fee.lateFeeAmount || 0);
            if (lateType === 'PERCENTAGE') {
                surchargeAmount = Number(((baseFee * lateVal) / 100).toFixed(2));
            }
            else if (lateType === 'FIXED') {
                surchargeAmount = lateVal;
            }
            const lateTotal = Number((baseFee + surchargeAmount).toFixed(2));
            totalBaseRevenue += baseFee;
            totalEarlyBirdRevenue += earlyBirdTotal;
            totalLateRevenue += lateTotal;
            return {
                propertyId: prop.id,
                address: `${prop.street} #${prop.exterior_number}${prop.interior_number ? ' Int ' + prop.interior_number : ''}`,
                lotSizeM2: Number(prop.lot_size_m2),
                isDelinquent: prop.is_delinquent,
                baseFee,
                discountAmount,
                earlyBirdTotal,
                surchargeAmount,
                lateTotal,
            };
        });
        return {
            feeSummary: {
                id: fee.id,
                name: fee.name,
                feeType: fee.fee_type || fee.feeType,
                baseAmount: Number(fee.base_amount || fee.baseAmount),
                frequency: fee.frequency,
                dueDay: fee.due_day || fee.dueDay,
                graceDays: fee.grace_days || fee.graceDays,
                lateFeePolicy: `${fee.late_fee_type || fee.lateFeeType} (${fee.late_fee_amount || fee.lateFeeAmount})`,
                earlyBirdPolicy: `${fee.early_bird_discount_type || fee.earlyBirdDiscountType} (${fee.early_bird_discount_amount || fee.earlyBirdDiscountAmount})`,
            },
            projection: {
                totalPropertiesCount: properties.length,
                projectedBaseRevenue: Number(totalBaseRevenue.toFixed(2)),
                projectedEarlyBirdRevenue: Number(totalEarlyBirdRevenue.toFixed(2)),
                projectedLateRevenue: Number(totalLateRevenue.toFixed(2)),
                averageFeePerProperty: properties.length > 0 ? Number((totalBaseRevenue / properties.length).toFixed(2)) : 0,
            },
            propertiesSample: propertyBreakdowns.slice(0, 10),
        };
    }
};
exports.FeeConfigurationService = FeeConfigurationService;
exports.FeeConfigurationService = FeeConfigurationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [fee_configuration_repository_1.FeeConfigurationRepository,
        tenants_service_1.TenantsService])
], FeeConfigurationService);
//# sourceMappingURL=fee-configuration.service.js.map