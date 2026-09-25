import { DatabaseService } from '../../../database/database.service';
export declare class TenantsRepository {
    private readonly db;
    constructor(db: DatabaseService);
    findAll(): Promise<any[]>;
    findById(id: string): Promise<any>;
    findBySlug(slug: string): Promise<any>;
    existsBySlug(slug: string): Promise<boolean>;
    provisionSchema(slug: string, name: string, tier: string, maxProperties: number, contactEmail?: string): Promise<string>;
    updateDomains(tenantId: string, hasCustomDomain: boolean, customDomain: string | null, accessUrl: string, modules?: string[]): Promise<void>;
    updateTenant(idOrSlug: string, data: {
        name?: string;
        tier?: string;
        maxProperties?: number;
        contactEmail?: string;
        hasCustomDomain?: boolean;
        customDomain?: string | null;
        accessUrl?: string;
        isActive?: boolean;
        modules?: string[];
    }): Promise<any>;
}
