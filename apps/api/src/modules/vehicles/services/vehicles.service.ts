import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { VehiclesRepository } from '../repositories/vehicles.repository';
import { TenantsRepository } from '../../tenants/repositories/tenants.repository';
import { CreateVehicleDto, UpdateVehicleDto } from '../dto/vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly vehiclesRepo: VehiclesRepository,
    private readonly tenantsRepo: TenantsRepository,
  ) {}

  private async validateTenant(slug: string) {
    const tenant = await this.tenantsRepo.findBySlug(slug);
    if (!tenant) {
      throw new NotFoundException(`Fraccionamiento con slug "${slug}" no encontrado`);
    }
    return tenant;
  }

  async getTenantVehicles(slug: string, propertyId?: string) {
    await this.validateTenant(slug);
    return this.vehiclesRepo.findAllByTenant(slug, propertyId);
  }

  async createTenantVehicle(slug: string, dto: CreateVehicleDto) {
    await this.validateTenant(slug);

    // Verify property exists
    const propExists = await this.vehiclesRepo.checkPropertyExists(slug, dto.propertyId);
    if (!propExists) {
      throw new NotFoundException('La propiedad seleccionada no existe.');
    }

    const plates = dto.plates.trim().toUpperCase();

    // Check plates uniqueness within tenant
    const plateExists = await this.vehiclesRepo.checkPlatesExists(slug, plates);
    if (plateExists) {
      throw new ConflictException(`Las placas "${plates}" ya están registradas en este fraccionamiento.`);
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

  async updateTenantVehicle(slug: string, id: string, dto: UpdateVehicleDto) {
    await this.validateTenant(slug);

    const current = await this.vehiclesRepo.findById(slug, id);
    if (!current) {
      throw new NotFoundException(`Vehículo con ID "${id}" no encontrado.`);
    }

    let plates = current.plates;
    if (dto.plates && dto.plates.trim().toUpperCase() !== current.plates.toUpperCase()) {
      plates = dto.plates.trim().toUpperCase();
      const plateExists = await this.vehiclesRepo.checkPlatesExists(slug, plates, id);
      if (plateExists) {
        throw new ConflictException(`Las placas "${plates}" ya están registradas.`);
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

  async deleteTenantVehicle(slug: string, id: string) {
    await this.validateTenant(slug);

    const existing = await this.vehiclesRepo.findById(slug, id);
    if (!existing) {
      throw new NotFoundException(`Vehículo con ID "${id}" no encontrado.`);
    }

    await this.vehiclesRepo.delete(slug, id);
    return { success: true, message: 'Vehículo eliminado exitosamente del registro.' };
  }
}
