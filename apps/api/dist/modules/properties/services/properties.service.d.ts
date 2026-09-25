import { PropertiesRepository } from '../repositories/properties.repository';
import { TenantsRepository } from '../../tenants/repositories/tenants.repository';
import { CreatePropertyDto, UpdatePropertyDto } from '../dto/property.dto';
export declare class PropertiesService {
    private readonly propertiesRepo;
    private readonly tenantsRepo;
    constructor(propertiesRepo: PropertiesRepository, tenantsRepo: TenantsRepository);
    private getValidTenant;
    getTenantProperties(slug: string): Promise<{
        properties: any[];
        metrics: {
            total: number;
            maxAllowed: number;
            remaining: number;
            usagePercentage: number;
            isLimitReached: boolean;
            delinquentCount: number;
            upToDateCount: number;
            totalResidents: any;
            ownersCount: any;
            tenantsCount: any;
            familyCount: any;
            totalVehicles: any;
        };
        tenant: {
            id: any;
            slug: any;
            name: any;
            tier: any;
            maxProperties: any;
            accessUrl: any;
            hasCustomDomain: any;
            customDomain: any;
        };
    }>;
    createTenantProperty(slug: string, dto: CreatePropertyDto): Promise<any>;
    updateTenantProperty(slug: string, id: string, dto: UpdatePropertyDto): Promise<any>;
    deleteTenantProperty(slug: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
