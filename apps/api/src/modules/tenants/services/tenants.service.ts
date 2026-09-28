import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { TenantsRepository } from '../repositories/tenants.repository';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly tenantsRepo: TenantsRepository) {}

  async findAll() {
    return this.tenantsRepo.findAll();
  }

  async findBySlug(slug: string) {
    const tenant = await this.tenantsRepo.findBySlug(slug);
    if (!tenant) {
      throw new NotFoundException(`Fraccionamiento con slug "${slug}" no encontrado`);
    }
    return tenant;
  }

  async create(dto: CreateTenantDto) {
    const slug = dto.slug.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');

    // Check slug collision
    const exists = await this.tenantsRepo.existsBySlug(slug);
    if (exists) {
      throw new ConflictException(`El subdominio/slug "${slug}" ya está en uso.`);
    }

    const tier = dto.tier || 'STANDARD';
    const maxProperties = dto.maxProperties || 100;
    const modules = dto.modules && dto.modules.length > 0 ? dto.modules : ['FINANCE', 'ACCESS_QR', 'RESIDENT_APP'];

    const tenantId = await this.tenantsRepo.provisionSchema(
      slug,
      dto.name,
      tier,
      maxProperties,
      dto.contactEmail,
    );

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

  async update(slug: string, dto: UpdateTenantDto) {
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
}

