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
}
