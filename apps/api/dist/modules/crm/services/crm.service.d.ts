import { CrmRepository } from '../repositories/crm.repository';
import { TenantsService } from '../../tenants/services/tenants.service';
import { CreateProspectDto } from '../dto/create-prospect.dto';
import { UpdateStageDto } from '../dto/update-stage.dto';
import { CreateGatewayDto } from '../dto/create-gateway.dto';
import { SelfServiceProvisionDto } from '../dto/self-service-provision.dto';
import { UpdatePlanDto } from '../dto/update-plan.dto';
import { SaasMailService } from './saas-mail.service';
export declare class CrmService {
    private readonly crmRepo;
    private readonly tenantsService;
    private readonly saasMail;
    private readonly logger;
    constructor(crmRepo: CrmRepository, tenantsService: TenantsService, saasMail: SaasMailService);
    createProspect(dto: CreateProspectDto): Promise<any>;
    findAllProspects(): Promise<any[]>;
    updateProspectStage(id: string, dto: UpdateStageDto): Promise<any>;
    findAllGateways(): Promise<any[]>;
    registerGateway(dto: CreateGatewayDto): Promise<any>;
    recordHeartbeat(uuid: string, ipLocal?: string): Promise<any>;
    updateGateway(uuid: string, dto: {
        name?: string;
        tenantId?: string;
        firmwareVersion?: string;
        notes?: string;
    }): Promise<any>;
    getPlans(): Promise<any[]>;
    getPublicPlans(): Promise<any[]>;
    updatePlan(idOrTier: string, dto: UpdatePlanDto): Promise<any>;
    getMetrics(): Promise<{
        financials: {
            currency: string;
            mrr: number;
            arr: number;
            churnRate: number;
            tierBreakdown: Record<string, number>;
            activeSubscriptionsCount: number;
            unverifiedSubscriptionContractsCount: number;
        };
        finances: {
            currency: string;
            mrr: number;
            arr: number;
            churnRate: number;
            tierBreakdown: Record<string, number>;
            activeSubscriptionsCount: number;
            unverifiedSubscriptionContractsCount: number;
        };
        communities: {
            totalTenants: number;
            activeTenants: number;
            totalHouses: number;
        };
        pipeline: {
            total: number;
            totalProspects: number;
            stages: Record<string, number>;
            funnel: Record<string, number>;
            conversionRate: number;
        };
        iot: {
            totalGateways: number;
            onlineGateways: number;
            offlineGateways: number;
        };
        activeTenants: number;
        onlineGateways: number;
    }>;
    selfServiceProvision(dto: SelfServiceProvisionDto): Promise<{
        tenantId: string;
        slug: string;
        communityName: string;
        tier: string;
        maxHouses: number;
        hasCustomDomain: boolean;
        customDomain: string;
        accessUrl: string;
        adminEmail: string;
        defaultPassword: string;
        monthlyPrice: number;
        currency: string;
        schema: string;
    }>;
    getCurrentContract(tenantId: string): Promise<any>;
    createInitialContract(tenantId: string, billingInterval?: 'MONTHLY' | 'ANNUAL'): Promise<{
        contract: any;
        created: boolean;
        conflict?: undefined;
    }>;
    reconcileCurrentContract(tenantId: string, amount: number, currentPeriodEnd: string, billingInterval: 'MONTHLY' | 'ANNUAL'): Promise<any>;
    recordRenewalNotice(tenantId: string, recipient: string, noticeSent: boolean): Promise<any>;
    sendRenewalNotice(tenantId: string, recipient: string): Promise<any>;
    previewRenewalNotice(tenantId: string, recipient: string): Promise<{
        preview: boolean;
        recipient: string;
    }>;
    renewSubscription(tenantId: string): Promise<any>;
}
