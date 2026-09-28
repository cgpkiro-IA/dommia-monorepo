import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PropertiesRepository } from '../repositories/properties.repository';
import { TenantsRepository } from '../../tenants/repositories/tenants.repository';
import { CreatePropertyDto, UpdatePropertyDto } from '../dto/property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly propertiesRepo: PropertiesRepository,
    private readonly tenantsRepo: TenantsRepository,
  ) {}

  private async getValidTenant(slug: string) {
    const tenant = await this.tenantsRepo.findBySlug(slug);
    if (!tenant) {
      throw new NotFoundException(`Fraccionamiento con slug "${slug}" no encontrado`);
    }
    return tenant;
  }

  async getTenantProperties(slug: string) {
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

  async createTenantProperty(slug: string, dto: CreatePropertyDto) {
    const tenant = await this.getValidTenant(slug);

    // HARD LIMIT ENFORCEMENT
    const currentCount = await this.propertiesRepo.countProperties(slug);
    if (currentCount >= Number(tenant.max_properties)) {
      throw new ConflictException({
        code: 'LIMIT_EXCEEDED',
        message: `Límite de propiedades alcanzado: Tu plan ${tenant.tier} permite un máximo de ${tenant.max_properties} viviendas. Para registrar más propiedades, actualiza a un plan superior (Upgrade).`,
        currentCount,
        maxProperties: tenant.max_properties,
        tier: tenant.tier,
      });
    }

    return this.propertiesRepo.create(slug, dto);
  }

  async updateTenantProperty(slug: string, id: string, dto: UpdatePropertyDto) {
    await this.getValidTenant(slug);

    const current = await this.propertiesRepo.findById(slug, id);
    if (!current) {
      throw new NotFoundException(`Propiedad con ID "${id}" no encontrada.`);
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

  async deleteTenantProperty(slug: string, id: string) {
    await this.getValidTenant(slug);

    const existing = await this.propertiesRepo.findById(slug, id);
    if (!existing) {
      throw new NotFoundException(`Propiedad con ID "${id}" no encontrada.`);
    }

    await this.propertiesRepo.delete(slug, id);
    return { success: true, message: 'Propiedad eliminada correctamente.' };
  }
}
