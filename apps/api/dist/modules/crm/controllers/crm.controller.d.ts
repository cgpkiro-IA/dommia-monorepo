import { CrmService } from '../services/crm.service';
import { CrmAnalyticsService } from '../services/crm-analytics.service';
import { CrmAlertsService } from '../services/crm-alerts.service';
import { TelegramAlertService } from '../services/telegram-alert.service';
import { CreateProspectDto } from '../dto/create-prospect.dto';
import { UpdateStageDto } from '../dto/update-stage.dto';
import { CreateGatewayDto } from '../dto/create-gateway.dto';
import { SelfServiceProvisionDto } from '../dto/self-service-provision.dto';
import { UpdatePlanDto } from '../dto/update-plan.dto';
import { CreateCrmAlertDto, GatewayHeartbeatDto, ResolveCrmAlertDto, TestTelegramNotificationDto, UpdateGatewayDto, UpdateTelegramConfigDto } from '../dto/crm.dto';
export declare class CrmController {
    private readonly crmService;
    private readonly crmAnalyticsService;
    private readonly crmAlertsService;
    private readonly telegramAlertService;
    constructor(crmService: CrmService, crmAnalyticsService: CrmAnalyticsService, crmAlertsService: CrmAlertsService, telegramAlertService: TelegramAlertService);
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
    recordHeartbeat(uuid: string, body: GatewayHeartbeatDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    updateGateway(uuid: string, body: UpdateGatewayDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getAnalytics(): Promise<{
        success: boolean;
        data: import("../services/crm-analytics.service").CrmAnalyticsPayload;
    }>;
    getAlerts(status?: string, severity?: string): Promise<{
        success: boolean;
        data: import("../services/crm-alerts.service").CrmPlatformAlert[];
        summary: any;
    }>;
    createAlert(dto: CreateCrmAlertDto): Promise<{
        success: boolean;
        message: string;
        data: import("../services/crm-alerts.service").CrmPlatformAlert;
    }>;
    acknowledgeAlert(id: string, request: {
        user?: {
            email: string;
        };
    }): Promise<{
        success: boolean;
        message: string;
        data: import("../services/crm-alerts.service").CrmPlatformAlert;
    }>;
    resolveAlert(id: string, body: ResolveCrmAlertDto, request: {
        user?: {
            email: string;
        };
    }): Promise<{
        success: boolean;
        message: string;
        data: import("../services/crm-alerts.service").CrmPlatformAlert;
    }>;
    getTelegramConfig(): Promise<{
        success: boolean;
        data: import("../services/telegram-alert.service").TelegramConfig;
    }>;
    updateTelegramConfig(body: UpdateTelegramConfigDto): Promise<{
        success: boolean;
        message: string;
        data: import("../services/telegram-alert.service").TelegramConfig;
    }>;
    testTelegramNotification(body: TestTelegramNotificationDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
