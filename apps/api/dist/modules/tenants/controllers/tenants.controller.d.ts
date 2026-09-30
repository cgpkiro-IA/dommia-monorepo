import { TenantsService } from '../services/tenants.service';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
export declare class TenantsController {
    private readonly tenantsService;
    constructor(tenantsService: TenantsService);
    findAll(): Promise<{
        success: boolean;
        data: any[];
        count: number;
    }>;
    findOne(slug: string): Promise<{
        success: boolean;
        data: any;
    }>;
    create(dto: CreateTenantDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            slug: string;
            name: string;
            subdomain: string;
            hasCustomDomain: boolean;
            customDomain: string;
            accessUrl: string;
            tier: string;
            maxProperties: number;
            schema: string;
            modules: string[];
            status: string;
        };
    }>;
    update(slug: string, dto: UpdateTenantDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    patch(slug: string, dto: UpdateTenantDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
}
