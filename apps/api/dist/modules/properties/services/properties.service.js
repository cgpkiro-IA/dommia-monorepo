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
exports.PropertiesService = void 0;
const common_1 = require("@nestjs/common");
const properties_repository_1 = require("../repositories/properties.repository");
const tenants_repository_1 = require("../../tenants/repositories/tenants.repository");
let PropertiesService = class PropertiesService {
    propertiesRepo;
    tenantsRepo;
    constructor(propertiesRepo, tenantsRepo) {
        this.propertiesRepo = propertiesRepo;
        this.tenantsRepo = tenantsRepo;
    }
    async getValidTenant(slug) {
        const tenant = await this.tenantsRepo.findBySlug(slug);
        if (!tenant) {
            throw new common_1.NotFoundException(`Fraccionamiento con slug "${slug}" no encontrado`);
        }
        return tenant;
    }
    async getTenantProperties(slug) {
        const tenant = await this.getValidTenant(slug);
        const properties = await this.propertiesRepo.findAllByTenant(slug);
        const { residentStats, totalVehicles } = await this.propertiesRepo.getResidentAndVehicleStats(slug);
        const total = properties.length;
        const maxAllowed = Number(tenant.max_properties);
        const remaining = Math.max(0, maxAllowed - total);
        const usagePercentage = maxAllowed > 0 ? Math.min(100, Math.round((total / maxAllowed) * 100)) : 0;
        const isLimitReached = total >= maxAllowed;
        const delinquentCount = properties.filter((p) => p.is_delinquent).length;
        const upToDateCount = total - delinquentCount;
        return {
            properties,
            metrics: {
                total,
                maxAllowed,
                remaining,
                usagePercentage,
                isLimitReached,
                delinquentCount,
                upToDateCount,
                totalResidents: residentStats.total_residents,
                ownersCount: residentStats.owners_count,
                tenantsCount: residentStats.tenants_count,
                familyCount: residentStats.family_count,
                totalVehicles,
            },
            tenant: {
                id: tenant.id,
                slug: tenant.slug,
                name: tenant.name,
                tier: tenant.tier,
                maxProperties: tenant.max_properties,
                accessUrl: tenant.access_url,
                hasCustomDomain: tenant.has_custom_domain,
                customDomain: tenant.custom_domain,
            },
        };
    }
    async createTenantProperty(slug, dto) {
        const tenant = await this.getValidTenant(slug);
        const currentCount = await this.propertiesRepo.countProperties(slug);
        if (currentCount >= Number(tenant.max_properties)) {
            throw new common_1.ConflictException({
                code: 'LIMIT_EXCEEDED',
                message: `Límite de propiedades alcanzado: Tu plan ${tenant.tier} permite un máximo de ${tenant.max_properties} viviendas. Para registrar más propiedades, actualiza a un plan superior (Upgrade).`,
                currentCount,
                maxProperties: tenant.max_properties,
                tier: tenant.tier,
            });
        }
        return this.propertiesRepo.create(slug, dto);
    }
    async updateTenantProperty(slug, id, dto) {
        await this.getValidTenant(slug);
        const current = await this.propertiesRepo.findById(slug, id);
        if (!current) {
            throw new common_1.NotFoundException(`Propiedad con ID "${id}" no encontrada.`);
        }
        const street = dto.street !== undefined ? dto.street.trim() : current.street;
        const exteriorNumber = dto.exteriorNumber !== undefined ? dto.exteriorNumber.trim() : current.exterior_number;
        const interiorNumber = dto.interiorNumber !== undefined ? dto.interiorNumber?.trim() : current.interior_number;
        const block = dto.block !== undefined ? dto.block?.trim() : current.block;
        const lot = dto.lot !== undefined ? dto.lot?.trim() : current.lot;
        const notes = dto.notes !== undefined ? dto.notes?.trim() : current.notes;
        const isDelinquent = dto.isDelinquent !== undefined ? dto.isDelinquent : current.is_delinquent;
        return this.propertiesRepo.update(slug, id, {
            street,
            exteriorNumber,
            interiorNumber,
            block,
            lot,
            notes,
            isDelinquent,
        });
    }
    async deleteTenantProperty(slug, id) {
        await this.getValidTenant(slug);
        const existing = await this.propertiesRepo.findById(slug, id);
        if (!existing) {
            throw new common_1.NotFoundException(`Propiedad con ID "${id}" no encontrada.`);
        }
        await this.propertiesRepo.delete(slug, id);
        return { success: true, message: 'Propiedad eliminada correctamente.' };
    }
};
exports.PropertiesService = PropertiesService;
exports.PropertiesService = PropertiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [properties_repository_1.PropertiesRepository,
        tenants_repository_1.TenantsRepository])
], PropertiesService);
//# sourceMappingURL=properties.service.js.map