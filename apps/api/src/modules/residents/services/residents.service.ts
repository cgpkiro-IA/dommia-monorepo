import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ResidentsRepository } from '../repositories/residents.repository';
import { TenantsRepository } from '../../tenants/repositories/tenants.repository';
import { CreateResidentDto, UpdateResidentDto } from '../dto/resident.dto';

@Injectable()
export class ResidentsService {
  constructor(
    private readonly residentsRepo: ResidentsRepository,
    private readonly tenantsRepo: TenantsRepository,
  ) {}

  private async validateTenant(slug: string) {
    const tenant = await this.tenantsRepo.findBySlug(slug);
    if (!tenant) {
      throw new NotFoundException(`Fraccionamiento con slug "${slug}" no encontrado`);
    }
    return tenant;
  }

  async getTenantResidents(slug: string, propertyId?: string) {
    await this.validateTenant(slug);
    return this.residentsRepo.findAllByTenant(slug, propertyId);
  }

  async createTenantResident(slug: string, dto: CreateResidentDto) {
    await this.validateTenant(slug);

    // Verify property exists
    const propertyExists = await this.residentsRepo.checkPropertyExists(slug, dto.propertyId);
    if (!propertyExists) {
      throw new NotFoundException('La propiedad seleccionada no existe.');
    }

    // Check email uniqueness within tenant
    const emailExists = await this.residentsRepo.checkEmailExists(slug, dto.email);
    if (emailExists) {
      throw new ConflictException(`El correo electrónico "${dto.email}" ya está registrado para otro residente en este fraccionamiento.`);
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

  async updateTenantResident(slug: string, id: string, dto: UpdateResidentDto) {
    await this.validateTenant(slug);

    const current = await this.residentsRepo.findById(slug, id);
    if (!current) {
      throw new NotFoundException(`Residente con ID "${id}" no encontrado.`);
    }

    if (dto.email && dto.email.toLowerCase() !== current.email.toLowerCase()) {
      const emailExists = await this.residentsRepo.checkEmailExists(slug, dto.email, id);
      if (emailExists) {
        throw new ConflictException(`El correo electrónico "${dto.email}" ya está registrado por otro residente.`);
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

  async deleteTenantResident(slug: string, id: string) {
    await this.validateTenant(slug);

    const existing = await this.residentsRepo.findById(slug, id);
    if (!existing) {
      throw new NotFoundException(`Residente con ID "${id}" no encontrado.`);
    }

    await this.residentsRepo.delete(slug, id);
    return { success: true, message: 'Residente eliminado exitosamente del padrón.' };
  }
}
