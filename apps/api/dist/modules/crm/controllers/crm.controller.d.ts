import { CrmService } from '../services/crm.service';
import { CreateProspectDto } from '../dto/create-prospect.dto';
import { UpdateStageDto } from '../dto/update-stage.dto';
import { CreateGatewayDto } from '../dto/create-gateway.dto';
import { SelfServiceProvisionDto } from '../dto/self-service-provision.dto';
import { UpdatePlanDto } from '../dto/update-plan.dto';
export declare class CrmController {
    private readonly crmService;
    constructor(crmService: CrmService);
    getPlans(): Promise<{
        success: boolean;
        data: any[];
        count: number;
    }>;
    updatePlan(id: string, dto: UpdatePlanDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getMetrics(): Promise<{
        success: boolean;
        data: {
            financials: {
                currency: string;
                mrr: number;
                arr: number;
                churnRate: number;
                tierBreakdown: Record<string, number>;
                activeSubscriptionsCount: number;
            };
            finances: {
                currency: string;
                mrr: number;
                arr: number;
                churnRate: number;
                tierBreakdown: Record<string, number>;
                activeSubscriptionsCount: number;
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
        };
    }>;
    selfServiceProvision(dto: SelfServiceProvisionDto): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    createProspect(dto: CreateProspectDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getProspects(): Promise<{
        success: boolean;
        data: any[];
        count: number;
    }>;
    updateStage(id: string, dto: UpdateStageDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getGateways(): Promise<{
        success: boolean;
        data: any[];
        count: number;
    }>;
    registerGateway(dto: CreateGatewayDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    recordHeartbeat(uuid: string, body: {
        ipLocal?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    updateGateway(uuid: string, body: {
        name?: string;
        tenantId?: string;
        firmwareVersion?: string;
        notes?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
}
