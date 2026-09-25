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
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const tenants_repository_1 = require("../repositories/tenants.repository");
let TenantsService = class TenantsService {
    tenantsRepo;
    constructor(tenantsRepo) {
        this.tenantsRepo = tenantsRepo;
    }
    async findAll() {
        return this.tenantsRepo.findAll();
    }
    async findBySlug(slug) {
        const tenant = await this.tenantsRepo.findBySlug(slug);
        if (!tenant) {
            throw new common_1.NotFoundException(`Fraccionamiento con slug "${slug}" no encontrado`);
        }
        return tenant;
    }
    async create(dto) {
        const slug = dto.slug.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
        const exists = await this.tenantsRepo.existsBySlug(slug);
        if (exists) {
            throw new common_1.ConflictException(`El subdominio/slug "${slug}" ya está en uso.`);
        }
        const tier = dto.tier || 'STANDARD';
        const maxProperties = dto.maxProperties || 100;
        const modules = dto.modules && dto.modules.length > 0 ? dto.modules : ['FINANCE', 'ACCESS_QR', 'RESIDENT_APP'];
        const tenantId = await this.tenantsRepo.provisionSchema(slug, dto.name, tier, maxProperties, dto.contactEmail);
        const hasCustomDomain = tier === 'ENTERPRISE' || dto.hasCustomDomain === true;
        const customDomain = hasCustomDomain ? (dto.customDomain || `${slug}.dommia.com`) : null;
        const accessUrl = hasCustomDomain
            ? (dto.customDomain || `${slug}.dommia.com`)
            : `standar.dommia.com/${slug}`;
        await this.tenantsRepo.updateDomains(tenantId, hasCustomDomain, customDomain, accessUrl, modules);
        return {
            id: tenantId,
            slug,
            name: dto.name,
            subdomain: `${slug}.dommia.com`,
            hasCustomDomain,
            customDomain,
            accessUrl,
            tier,
            maxProperties,
            schema: `tenant_${slug}`,
            modules,
            status: 'PROVISIONED',
        };
    }
    async update(slug, dto) {
        const existing = await this.findBySlug(slug);
        let hasCustomDomain = dto.hasCustomDomain !== undefined ? dto.hasCustomDomain : existing.has_custom_domain;
        if (dto.tier === 'ENTERPRISE') {
            hasCustomDomain = true;
        }
        let customDomain = dto.customDomain !== undefined ? dto.customDomain : existing.custom_domain;
        let accessUrl = dto.accessUrl !== undefined ? dto.accessUrl : existing.access_url;
        if (hasCustomDomain && !customDomain) {
            customDomain = `${existing.slug}.dommia.com`;
        }
        if (!accessUrl) {
            accessUrl = hasCustomDomain ? (customDomain || `${existing.slug}.dommia.com`) : `standar.dommia.com/${existing.slug}`;
        }
        const updated = await this.tenantsRepo.updateTenant(existing.id, {
            name: dto.name,
            tier: dto.tier,
            maxProperties: dto.maxProperties,
            contactEmail: dto.contactEmail,
            hasCustomDomain,
            customDomain,
            accessUrl,
            isActive: dto.isActive,
            modules: dto.modules,
        });
        return updated;
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tenants_repository_1.TenantsRepository])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map