import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CrmRepository } from '../repositories/crm.repository';
import { TenantsService } from '../../tenants/services/tenants.service';
import { CreateProspectDto } from '../dto/create-prospect.dto';
import { UpdateStageDto } from '../dto/update-stage.dto';
import { CreateGatewayDto } from '../dto/create-gateway.dto';
import { SelfServiceProvisionDto } from '../dto/self-service-provision.dto';
import { UpdatePlanDto } from '../dto/update-plan.dto';
import { SaasMailService } from './saas-mail.service';

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(
    private readonly crmRepo: CrmRepository,
    private readonly tenantsService: TenantsService,
    private readonly saasMail: SaasMailService,
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

  async getPublicPlans() {
    return this.crmRepo.findPublicPlans();
  }

  async updatePlan(idOrTier: string, dto: UpdatePlanDto) {
    let plan = await this.crmRepo.findPlanById(idOrTier);
    if (!plan) {
      plan = await this.crmRepo.findPlanByCode(idOrTier.toUpperCase());
    }
    if (!plan) {
      throw new NotFoundException(`Plan con identificador "${idOrTier}" no encontrado.`);
    }

    const minProperties = dto.minProperties ?? Number(plan.min_properties);
    const maxProperties = dto.maxProperties ?? Number(plan.max_properties);
    if (minProperties > maxProperties) {
      throw new BadRequestException('El mínimo de viviendas no puede superar el máximo del plan.');
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
      const hasVerifiedContractAmount = tenant.subscription_amount !== null
        && tenant.subscription_amount !== undefined
        && !tenant.contract_review_required;
      mrr += hasVerifiedContractAmount
        ? Number(tenant.subscription_amount) / (tenant.subscription_billing_interval === 'ANNUAL' ? 12 : 1)
        : tierPrice + addOnDomainPrice;

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
      unverifiedSubscriptionContractsCount: raw.activeTenants.filter((tenant: any) =>
        tenant.subscription_id && (tenant.subscription_amount === null || tenant.contract_review_required),
      ).length,
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
    const customDomain = hasCustomDomain ? `${slug}.dommia.com.mx` : null;

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
    if (hasCustomDomain && tier !== 'ENTERPRISE' && !plan?.includesCustomDomain) {
      const domainAddonPrice = plan ? Number(plan.customDomainAddonPrice) : 490;
      basePrice += domainAddonPrice;
      addOns.push({ type: 'CUSTOM_DOMAIN', name: 'Subdominio Personalizado', price: domainAddonPrice });
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

  async getCurrentContract(tenantId: string) {
    const contract = await this.crmRepo.findCurrentContract(tenantId);
    if (!contract) throw new NotFoundException(`No hay un contrato activo para el tenant ${tenantId}.`);
    return contract;
  }

  async createInitialContract(tenantId: string, billingInterval: 'MONTHLY' | 'ANNUAL' = 'MONTHLY') {
    const result = await this.crmRepo.createInitialContract(tenantId, billingInterval);
    if ('conflict' in result) {
      if (result.conflict === 'not_found') throw new NotFoundException('Fraccionamiento no encontrado o inactivo.');
      throw new ConflictException('El tier del fraccionamiento no tiene un plan activo en el catálogo.');
    }
    return result;
  }

  async reconcileCurrentContract(tenantId: string, amount: number, currentPeriodEnd: string, billingInterval: 'MONTHLY' | 'ANNUAL') {
    const periodEnd = new Date(currentPeriodEnd);
    if (!Number.isFinite(periodEnd.getTime()) || periodEnd.getTime() <= Date.now()) {
      throw new BadRequestException('La fecha pagada hasta debe ser posterior a hoy.');
    }
    const result = await this.crmRepo.reconcileCurrentContract(tenantId, amount, periodEnd, billingInterval);
    if ('conflict' in result) {
      if (result.conflict === 'not_found') throw new NotFoundException('Fraccionamiento no encontrado o inactivo.');
      throw new ConflictException('El contrato ya tiene un monto verificado y no requiere reconciliación.');
    }
    return result.contract;
  }

  async recordRenewalNotice(tenantId: string, recipient: string, noticeSent: boolean) {
    if (!noticeSent) throw new BadRequestException('Confirma que el aviso se envió antes de registrarlo.');
    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.trim())) {
      throw new BadRequestException('Proporciona un correo válido como destinatario del aviso registrado.');
    }
    const current = await this.crmRepo.findCurrentContract(tenantId);
    if (!current) throw new NotFoundException(`No hay un contrato activo para el tenant ${tenantId}.`);
    if (current.amount === null || current.contractReviewRequired) {
      throw new ConflictException('El contrato requiere reconciliación antes de registrar un aviso de renovación.');
    }
    if (!current.currentPeriodEnd || new Date(current.currentPeriodEnd).getTime() <= Date.now()) {
      throw new ConflictException('El periodo actual ya venció; no se puede registrar un aviso previo.');
    }
    const contract = await this.crmRepo.recordRenewalNotice(tenantId, recipient);
    if (!contract) {
      throw new NotFoundException('No se encontró un contrato activo con un plan vigente para registrar el aviso.');
    }
    const amount = Number(contract.renewalAmount).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const renewalDate = new Date(contract.currentPeriodEnd).toLocaleDateString('es-MX');
    return {
      ...contract,
      suggestedNoticeText: `Te informamos que, a partir de la renovación de tu suscripción el ${renewalDate}, la tarifa ${contract.billingInterval === 'ANNUAL' ? 'anual' : 'mensual'} será de $${amount} MXN.`,
      emailSent: false,
    };
  }

  async sendRenewalNotice(tenantId: string, recipient: string) {
    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.trim())) {
      throw new BadRequestException('Proporciona un correo válido para enviar el aviso.');
    }
    const result = await this.crmRepo.sendRenewalNotice(tenantId, recipient.trim(), async (notice) => {
      await this.saasMail.sendRenewalNotice(recipient.trim(), notice);
    });
    if ('conflict' in result) {
      const messages: Record<string, string> = {
        not_found: 'No hay un contrato activo para este fraccionamiento.',
        reconciliation_required: 'El contrato debe reconciliarse antes de enviar el aviso.',
        expired: 'El periodo actual ya venció; el aviso previo no se puede enviar.',
        plan_unavailable: 'El plan ya no está disponible en el catálogo.',
        no_increase: 'La tarifa vigente no aumentó; no se requiere aviso de incremento.',
        already_sent: 'El aviso de esta tarifa ya fue enviado y registrado.',
      };
      throw new ConflictException(messages[result.conflict]);
    }
    return { ...result.notice, emailSent: true };
  }

  async previewRenewalNotice(tenantId: string, recipient: string) {
    const contract = await this.crmRepo.findCurrentContract(tenantId);
    if (!contract) throw new NotFoundException('No hay un contrato activo para este fraccionamiento.');
    if (contract.amount === null || contract.contractReviewRequired) {
      throw new ConflictException('El contrato requiere reconciliación antes de enviar una prueba.');
    }
    if (!contract.currentPeriodEnd || new Date(contract.currentPeriodEnd).getTime() <= Date.now()) {
      throw new ConflictException('El periodo actual ya venció.');
    }
    if (contract.catalogRenewalAmount === null || Number(contract.catalogRenewalAmount) <= Number(contract.amount)) {
      throw new ConflictException('No hay un aumento de tarifa para mostrar en la vista previa.');
    }
    await this.saasMail.sendRenewalNotice(recipient, {
      tenantName: contract.tenantName,
      currentAmount: Number(contract.amount),
      renewalAmount: Number(contract.catalogRenewalAmount),
      billingInterval: contract.billingInterval,
      currentPeriodEnd: new Date(contract.currentPeriodEnd),
      preview: true,
    });
    return { preview: true, recipient };
  }

  async renewSubscription(tenantId: string) {
    const result = await this.crmRepo.renewSubscription(tenantId);
    if ('conflict' in result) {
      const messages: Record<string, string> = {
        not_found: `No hay un contrato activo para el tenant ${tenantId}.`,
        not_due: 'El periodo actual todavía no vence; la renovación solo está permitida al vencimiento.',
        reconciliation_required: 'El contrato no tiene un importe histórico verificado. Debe reconciliarse explícitamente antes de renovar.',
        plan_unavailable: 'El plan del contrato no está activo en el catálogo; no se puede calcular la renovación.',
        notice_required: 'El aumento requiere un aviso registrado antes del vencimiento y un importe de renovación notificado.',
      };
      if (result.conflict === 'not_found') throw new NotFoundException(messages[result.conflict]);
      throw new ConflictException(messages[result.conflict]);
    }
    return result.successor;
  }
}
