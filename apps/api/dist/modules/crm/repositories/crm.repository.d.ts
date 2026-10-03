import { DatabaseService } from '../../../database/database.service';
export declare class CrmRepository {
    private readonly db;
    constructor(db: DatabaseService);
    insertProspect(data: {
        name: string;
        email: string;
        phone: string;
        communityName: string;
        estimatedHouses: number;
        notes: string;
    }): Promise<any>;
    findAllProspects(): Promise<any[]>;
    findProspectById(id: string): Promise<any>;
    updateProspectStage(id: string, stage: string): Promise<any>;
    findAllGateways(): Promise<any[]>;
    findGatewayByUuid(uuid: string): Promise<any>;
    createGateway(data: {
        uuid: string;
        name?: string;
        firmwareVersion?: string;
        tenantId?: string;
    }): Promise<any>;
    updateHeartbeat(uuid: string, ipLocal?: string): Promise<any>;
    updateGateway(uuid: string, data: {
        name?: string;
        tenantId?: string | null;
        firmwareVersion?: string;
        notes?: string;
    }): Promise<any>;
    findPublicPlans(): Promise<any[]>;
    findAllPlans(): Promise<any[]>;
    findPlanById(id: string): Promise<any>;
    findPlanByCode(code: string): Promise<any>;
    updatePlan(id: string, data: any): Promise<any>;
    getMetricsRaw(): Promise<{
        prospectsByStage: any[];
        activeTenants: any[];
        totalGatewaysCount: any;
        onlineGatewaysCount: any;
        plans: any[];
    }>;
    recordProspectWon(data: {
        name: string;
        email: string;
        phone: string;
        communityName: string;
        maxHouses: number;
    }): Promise<any>;
    recordSubscription(data: {
        tenantId: string;
        tier: string;
        amount: number;
        hasCustomDomain: boolean;
        activeAddons: any[];
    }): Promise<void>;
    createInitialContract(tenantId: string, billingInterval?: 'MONTHLY' | 'ANNUAL'): Promise<{
        conflict: "not_found";
        contract?: undefined;
        created?: undefined;
    } | {
        contract: any;
        created: boolean;
        conflict?: undefined;
    } | {
        conflict: "plan_unavailable";
        contract?: undefined;
        created?: undefined;
    }>;
    reconcileCurrentContract(tenantId: string, amount: number, currentPeriodEnd: Date, billingInterval: 'MONTHLY' | 'ANNUAL'): Promise<{
        conflict: "not_found";
        contract?: undefined;
        created?: undefined;
    } | {
        conflict: "already_verified";
        contract?: undefined;
        created?: undefined;
    } | {
        contract: any;
        created: boolean;
        conflict?: undefined;
    }>;
    findCurrentContract(tenantId: string): Promise<any>;
    recordRenewalNotice(tenantId: string, recipient: string): Promise<any>;
    sendRenewalNotice(tenantId: string, recipient: string, deliver: (notice: {
        tenantName: string;
        currentAmount: number;
        renewalAmount: number;
        billingInterval: 'MONTHLY' | 'ANNUAL';
        currentPeriodEnd: Date;
    }) => Promise<void>): Promise<{
        conflict: "not_found";
        notice?: undefined;
    } | {
        conflict: "reconciliation_required";
        notice?: undefined;
    } | {
        conflict: "expired";
        notice?: undefined;
    } | {
        conflict: "plan_unavailable";
        notice?: undefined;
    } | {
        conflict: "no_increase";
        notice?: undefined;
    } | {
        conflict: "already_sent";
        notice?: undefined;
    } | {
        notice: any;
        conflict?: undefined;
    }>;
    renewSubscription(tenantId: string): Promise<{
        conflict: "not_found";
        successor?: undefined;
    } | {
        conflict: "not_due";
        successor?: undefined;
    } | {
        conflict: "reconciliation_required";
        successor?: undefined;
    } | {
        conflict: "plan_unavailable";
        successor?: undefined;
    } | {
        conflict: "notice_required";
        successor?: undefined;
    } | {
        successor: any;
        conflict?: undefined;
    }>;
}
