import { PropertiesService } from '../services/properties.service';
import { CreatePropertyDto, UpdatePropertyDto } from '../dto/property.dto';
export declare class PropertiesController {
    private readonly propertiesService;
    constructor(propertiesService: PropertiesService);
    getProperties(slug: string): Promise<{
        success: boolean;
        data: any[];
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
        count: number;
    }>;
    addProperty(slug: string, dto: CreatePropertyDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    updateProperty(slug: string, id: string, dto: UpdatePropertyDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    deleteProperty(slug: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
