import { TenantsRepository } from '../repositories/tenants.repository';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
export declare class TenantsService {
    private readonly tenantsRepo;
    constructor(tenantsRepo: TenantsRepository);
    findAll(): Promise<any[]>;
    findBySlug(slug: string): Promise<any>;
    create(dto: CreateTenantDto): Promise<{
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
    }>;
    update(slug: string, dto: UpdateTenantDto): Promise<any>;
}
