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
exports.ResidentsService = void 0;
const common_1 = require("@nestjs/common");
const residents_repository_1 = require("../repositories/residents.repository");
const tenants_repository_1 = require("../../tenants/repositories/tenants.repository");
let ResidentsService = class ResidentsService {
    residentsRepo;
    tenantsRepo;
    constructor(residentsRepo, tenantsRepo) {
        this.residentsRepo = residentsRepo;
        this.tenantsRepo = tenantsRepo;
    }
    async validateTenant(slug) {
        const tenant = await this.tenantsRepo.findBySlug(slug);
        if (!tenant) {
            throw new common_1.NotFoundException(`Fraccionamiento con slug "${slug}" no encontrado`);
        }
        return tenant;
    }
    async getTenantResidents(slug, propertyId) {
        await this.validateTenant(slug);
        return this.residentsRepo.findAllByTenant(slug, propertyId);
    }
    async createTenantResident(slug, dto) {
        await this.validateTenant(slug);
        const propertyExists = await this.residentsRepo.checkPropertyExists(slug, dto.propertyId);
        if (!propertyExists) {
            throw new common_1.NotFoundException('La propiedad seleccionada no existe.');
        }
        const emailExists = await this.residentsRepo.checkEmailExists(slug, dto.email);
        if (emailExists) {
            throw new common_1.ConflictException(`El correo electrónico "${dto.email}" ya está registrado para otro residente en este fraccionamiento.`);
        }
        const role = dto.role || 'OWNER';
        const isPrimary = dto.isPrimary !== undefined ? dto.isPrimary : (role === 'OWNER');
        const defaultPassword = dto.password || 'Dommia2026!';
        if (isPrimary) {
            await this.residentsRepo.resetPrimaryForProperty(slug, dto.propertyId);
        }
        const created = await this.residentsRepo.create(slug, {
            propertyId: dto.propertyId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            phone: dto.phone?.trim() || null,
            role,
            isPrimary,
            password: defaultPassword,
            isActive: dto.isActive !== undefined ? dto.isActive : true,
        });
        const full = await this.residentsRepo.findAllByTenant(slug);
        return full.find((r) => r.id === created.id) || created;
    }
    async updateTenantResident(slug, id, dto) {
        await this.validateTenant(slug);
        const current = await this.residentsRepo.findById(slug, id);
        if (!current) {
            throw new common_1.NotFoundException(`Residente con ID "${id}" no encontrado.`);
        }
        if (dto.email && dto.email.toLowerCase() !== current.email.toLowerCase()) {
            const emailExists = await this.residentsRepo.checkEmailExists(slug, dto.email, id);
            if (emailExists) {
                throw new common_1.ConflictException(`El correo electrónico "${dto.email}" ya está registrado por otro residente.`);
            }
        }
        const propertyId = dto.propertyId || current.property_id;
        const firstName = dto.firstName !== undefined ? dto.firstName.trim() : current.first_name;
        const lastName = dto.lastName !== undefined ? dto.lastName.trim() : current.last_name;
        const email = dto.email !== undefined ? dto.email.trim().toLowerCase() : current.email;
        const phone = dto.phone !== undefined ? dto.phone.trim() : current.phone;
        const role = dto.role !== undefined ? dto.role : current.role;
        const isPrimary = dto.isPrimary !== undefined ? dto.isPrimary : current.is_primary;
        const isActive = dto.isActive !== undefined ? dto.isActive : current.is_active;
        if (isPrimary && !current.is_primary) {
            await this.residentsRepo.resetPrimaryForProperty(slug, propertyId, id);
        }
        await this.residentsRepo.update(slug, id, {
            propertyId,
            firstName,
            lastName,
            email,
            phone,
            role,
            isPrimary,
            isActive,
        });
        const full = await this.residentsRepo.findAllByTenant(slug);
        return full.find((r) => r.id === id);
    }
    async deleteTenantResident(slug, id) {
        await this.validateTenant(slug);
        const existing = await this.residentsRepo.findById(slug, id);
        if (!existing) {
            throw new common_1.NotFoundException(`Residente con ID "${id}" no encontrado.`);
        }
        await this.residentsRepo.delete(slug, id);
        return { success: true, message: 'Residente eliminado exitosamente del padrón.' };
    }
};
exports.ResidentsService = ResidentsService;
exports.ResidentsService = ResidentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [residents_repository_1.ResidentsRepository,
        tenants_repository_1.TenantsRepository])
], ResidentsService);
//# sourceMappingURL=residents.service.js.map