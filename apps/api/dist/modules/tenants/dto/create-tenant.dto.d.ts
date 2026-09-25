export declare class CreateTenantDto {
    slug: string;
    name: string;
    tier?: string;
    maxProperties?: number;
    contactEmail?: string;
    hasCustomDomain?: boolean;
    customDomain?: string;
    modules?: string[];
}
