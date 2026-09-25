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
exports.VehiclesService = void 0;
const common_1 = require("@nestjs/common");
const vehicles_repository_1 = require("../repositories/vehicles.repository");
const tenants_repository_1 = require("../../tenants/repositories/tenants.repository");
let VehiclesService = class VehiclesService {
    vehiclesRepo;
    tenantsRepo;
    constructor(vehiclesRepo, tenantsRepo) {
        this.vehiclesRepo = vehiclesRepo;
        this.tenantsRepo = tenantsRepo;
    }
    async validateTenant(slug) {
        const tenant = await this.tenantsRepo.findBySlug(slug);
        if (!tenant) {
            throw new common_1.NotFoundException(`Fraccionamiento con slug "${slug}" no encontrado`);
        }
        return tenant;
    }
    async getTenantVehicles(slug, propertyId) {
        await this.validateTenant(slug);
        return this.vehiclesRepo.findAllByTenant(slug, propertyId);
    }
    async createTenantVehicle(slug, dto) {
        await this.validateTenant(slug);
        const propExists = await this.vehiclesRepo.checkPropertyExists(slug, dto.propertyId);
        if (!propExists) {
            throw new common_1.NotFoundException('La propiedad seleccionada no existe.');
        }
        const plates = dto.plates.trim().toUpperCase();
        const plateExists = await this.vehiclesRepo.checkPlatesExists(slug, plates);
        if (plateExists) {
            throw new common_1.ConflictException(`Las placas "${plates}" ya están registradas en este fraccionamiento.`);
        }
        const created = await this.vehiclesRepo.create(slug, {
            propertyId: dto.propertyId,
            residentId: dto.residentId || null,
            plates,
            brand: dto.brand?.trim() || null,
            model: dto.model?.trim() || null,
            color: dto.color?.trim() || null,
        });
        const full = await this.vehiclesRepo.findAllByTenant(slug);
        return full.find((v) => v.id === created.id) || created;
    }
    async updateTenantVehicle(slug, id, dto) {
        await this.validateTenant(slug);
        const current = await this.vehiclesRepo.findById(slug, id);
        if (!current) {
            throw new common_1.NotFoundException(`Vehículo con ID "${id}" no encontrado.`);
        }
        let plates = current.plates;
        if (dto.plates && dto.plates.trim().toUpperCase() !== current.plates.toUpperCase()) {
            plates = dto.plates.trim().toUpperCase();
            const plateExists = await this.vehiclesRepo.checkPlatesExists(slug, plates, id);
            if (plateExists) {
                throw new common_1.ConflictException(`Las placas "${plates}" ya están registradas.`);
            }
        }
        const propertyId = dto.propertyId || current.property_id;
        const residentId = dto.residentId !== undefined ? (dto.residentId || null) : current.resident_id;
        const brand = dto.brand !== undefined ? (dto.brand.trim() || null) : current.brand;
        const model = dto.model !== undefined ? (dto.model.trim() || null) : current.model;
        const color = dto.color !== undefined ? (dto.color.trim() || null) : current.color;
        await this.vehiclesRepo.update(slug, id, {
            propertyId,
            residentId,
            plates,
            brand,
            model,
            color,
        });
        const full = await this.vehiclesRepo.findAllByTenant(slug);
        return full.find((v) => v.id === id);
    }
    async deleteTenantVehicle(slug, id) {
        await this.validateTenant(slug);
        const existing = await this.vehiclesRepo.findById(slug, id);
        if (!existing) {
            throw new common_1.NotFoundException(`Vehículo con ID "${id}" no encontrado.`);
        }
        await this.vehiclesRepo.delete(slug, id);
        return { success: true, message: 'Vehículo eliminado exitosamente del registro.' };
    }
};
exports.VehiclesService = VehiclesService;
exports.VehiclesService = VehiclesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [vehicles_repository_1.VehiclesRepository,
        tenants_repository_1.TenantsRepository])
], VehiclesService);
//# sourceMappingURL=vehicles.service.js.map