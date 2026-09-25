import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CrmRepository } from '../repositories/crm.repository';
import { TenantsService } from '../../tenants/services/tenants.service';
import { CreateProspectDto } from '../dto/create-prospect.dto';
import { UpdateStageDto } from '../dto/update-stage.dto';
import { CreateGatewayDto } from '../dto/create-gateway.dto';
import { SelfServiceProvisionDto } from '../dto/self-service-provision.dto';
import { UpdatePlanDto } from '../dto/update-plan.dto';

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(
    private readonly crmRepo: CrmRepository,
    private readonly tenantsService: TenantsService,
  ) {}

  async createProspect(dto: CreateProspectDto) {
    if (dto.honeypot) {
      this.logger.warn(`Intento de bot bloqueado en demo: ${dto.email}`);
      return {
        id: '00000000-0000-0000-0000-000000000000',
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        community_name: dto.communityName,
        estimated_houses: dto.estimatedHouses || 50,
        stage: 'LEAD',
        notes: 'Filtered bot attempt',
        created_at: new Date().toISOString(),
      };
    }

    const emailDomain = dto.email.split('@')[1]?.toLowerCase().trim();
    const blockedDisposableDomains = [
      'mailinator.com', 'guerrillamail.com', '10minutemail.com',
      'tempmail.com', 'yopmail.com', 'sharklasers.com',
      'dispostable.com', 'trashmail.com', 'throwawaymail.com',
      'temp-mail.org', 'fakeinbox.com', 'getairmail.com',
    ];
    if (emailDomain && blockedDisposableDomains.includes(emailDomain)) {
      this.logger.warn(`Demo rechazada por dominio temporal: ${dto.email}`);
      throw new BadRequestException(
        'Por favor proporciona un correo corporativo o personal legítimo para programar la demostración.',
      );
    }

    return this.crmRepo.insertProspect({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      communityName: dto.communityName,
      estimatedHouses: dto.estimatedHouses || 50,
      notes: dto.notes || 'Prospecto captado desde la Landing Comercial Dommia',
    });
  }

  async findAllProspects() {
    return this.crmRepo.findAllProspects();
  }

  async updateProspectStage(id: string, dto: UpdateStageDto) {
    const prospect = await this.crmRepo.findProspectById(id);
    if (!prospect) {
      throw new NotFoundException(`Prospecto con ID ${id} no encontrado`);
    }
    return this.crmRepo.updateProspectStage(id, dto.stage);
  }

  async findAllGateways() {
    return this.crmRepo.findAllGateways();
  }

  async registerGateway(dto: CreateGatewayDto) {
    const existing = await this.crmRepo.findGatewayByUuid(dto.uuid);
    if (existing) {
      throw new ConflictException(`El gateway con UUID ${dto.uuid} ya está registrado`);
    }
    return this.crmRepo.createGateway(dto);
  }

  async recordHeartbeat(uuid: string, ipLocal?: string) {
    const updated = await this.crmRepo.updateHeartbeat(uuid, ipLocal);
    if (!updated) {
      throw new NotFoundException(`Gateway con UUID ${uuid} no encontrado en inventario`);
    }
    return updated;
  }

  async updateGateway(
    uuid: string,
    dto: { name?: string; tenantId?: string; firmwareVersion?: string; notes?: string },
  ) {
    const existing = await this.crmRepo.findGatewayByUuid(uuid);
    if (!existing) {
      throw new NotFoundException(`Gateway con UUID ${uuid} no encontrado en inventario`);
    }
    return this.crmRepo.updateGateway(uuid, dto);
  }


  async getPlans() {
    return this.crmRepo.findAllPlans();
  }

  async updatePlan(idOrTier: string, dto: UpdatePlanDto) {
    let plan = await this.crmRepo.findPlanById(idOrTier);
    if (!plan) {
      plan = await this.crmRepo.findPlanByCode(idOrTier.toUpperCase());
    }
    if (!plan) {
      throw new NotFoundException(`Plan con identificador "${idOrTier}" no encontrado.`);
    }

    return this.crmRepo.updatePlan(plan.id, dto);
  }

  async getMetrics() {
    const raw = await this.crmRepo.getMetricsRaw();

    const planPriceMap: Record<string, number> = {};
    for (const p of raw.plans) {
      planPriceMap[p.code] = Number(p.monthlyPrice);
    }

    let mrr = 0;
    const tierBreakdown: Record<string, number> = {
      BASIC: 0,
      STANDARD: 0,
      PROFESSIONAL: 0,
      ENTERPRISE: 0,
    };
    let totalHouses = 0;

    for (const tenant of raw.activeTenants) {
      const tierPrice = planPriceMap[tenant.tier] ?? (tenant.tier === 'BASIC' ? 1490 : tenant.tier === 'STANDARD' ? 2990 : 4990);
      const addOnDomainPrice = (tenant.has_custom_domain && tenant.tier !== 'ENTERPRISE') ? 490 : 0;
      mrr += (tierPrice + addOnDomainPrice);

      if (tenant.tier && tierBreakdown[tenant.tier] !== undefined) {
        tierBreakdown[tenant.tier]++;
      }
      totalHouses += Number(tenant.max_properties || 0);
    }

    const stages: Record<string, number> = {
      LEAD: 0,
      CONTACTED: 0,
      DEMO: 0,
      DEMO_SCHEDULED: 0,
      PROPOSAL: 0,
      NEGOTIATION: 0,
      WON: 0,
      LOST: 0,
    };
    raw.prospectsByStage.forEach((r: any) => {
      stages[r.stage] = Number(r.count);
    });

    // Map stages to crm-admin expected stage keys
    const funnel: Record<string, number> = {
      LEAD: stages.LEAD || 0,
      CONTACTED: stages.CONTACTED || 0,
      DEMO: (stages.DEMO || 0) + (stages.DEMO_SCHEDULED || 0),
      PROPOSAL: (stages.PROPOSAL || 0) + (stages.NEGOTIATION || 0),
      WON: stages.WON || 0,
    };

    const pipelineCount = stages.LEAD + stages.CONTACTED + stages.DEMO_SCHEDULED + stages.NEGOTIATION + (stages.DEMO || 0) + (stages.PROPOSAL || 0);
    const totalWon = stages.WON || 0;
    const totalFinished = (stages.WON || 0) + (stages.LOST || 0);
    const conversionRate = (pipelineCount + totalFinished) > 0 ? Math.round((totalWon / (pipelineCount + totalFinished)) * 100) : 0;

    const financials = {
      currency: 'MXN',
      mrr,
      arr: mrr * 12,
      churnRate: 0.0,
      tierBreakdown,
      activeSubscriptionsCount: raw.activeTenants.length,
    };

    const communities = {
      totalTenants: raw.activeTenants.length,
      activeTenants: raw.activeTenants.length,
      totalHouses,
    };

    const pipeline = {
      total: pipelineCount,
      totalProspects: pipelineCount,
      stages,
      funnel,
      conversionRate,
    };

    const totalGateways = Number(raw.totalGatewaysCount || raw.onlineGatewaysCount || 0);
    const onlineGateways = Number(raw.onlineGatewaysCount || 0);
    const offlineGateways = Math.max(0, totalGateways - onlineGateways);

    const iot = {
      totalGateways,
      onlineGateways,
      offlineGateways,
    };

    return {
      financials,
      finances: financials,
      communities,
      pipeline,
      iot,
      activeTenants: raw.activeTenants.length,
      onlineGateways,
    };
  }

  async selfServiceProvision(dto: SelfServiceProvisionDto) {
    const slug = dto.slug.toLowerCase().trim();
    const tier = dto.tier || 'STANDARD';
    const plan = await this.crmRepo.findPlanByCode(tier);
    const maxHouses = plan ? Number(plan.maxProperties) : (tier === 'BASIC' ? 50 : tier === 'STANDARD' ? 100 : 250);

    const hasCustomDomain = tier === 'ENTERPRISE' || dto.hasCustomDomain === true;
    const customDomain = hasCustomDomain ? `${slug}.dommia.com` : null;

    const newTenant = await this.tenantsService.create({
      slug,
      name: dto.communityName,
      tier,
      maxProperties: maxHouses,
      contactEmail: dto.adminEmail,
      hasCustomDomain,
      customDomain: customDomain || undefined,
    });

    let basePrice = plan ? Number(plan.monthlyPrice) : (tier === 'BASIC' ? 1490 : tier === 'STANDARD' ? 2990 : 4990);
    const addOns: any[] = [];
    if (hasCustomDomain && tier !== 'ENTERPRISE') {
      basePrice += 490;
      addOns.push({ type: 'CUSTOM_DOMAIN', name: 'Subdominio Personalizado', price: 490 });
    }

    await this.crmRepo.recordSubscription({
      tenantId: newTenant.id,
      tier,
      amount: basePrice,
      hasCustomDomain,
      activeAddons: addOns,
    });

    await this.crmRepo.recordProspectWon({
      name: dto.adminName,
      email: dto.adminEmail,
      phone: 'N/A',
      communityName: dto.communityName,
      maxHouses,
    });

    return {
      tenantId: newTenant.id,
      slug: newTenant.slug,
      communityName: newTenant.name,
      tier: newTenant.tier,
      maxHouses,
      hasCustomDomain: newTenant.hasCustomDomain,
      customDomain: newTenant.customDomain,
      accessUrl: newTenant.accessUrl,
      adminEmail: dto.adminEmail,
      defaultPassword: dto.adminPassword ? '****** (Configurada)' : 'Dommia2026!',
      monthlyPrice: basePrice,
      currency: 'MXN',
      schema: newTenant.schema,
    };
  }
}
