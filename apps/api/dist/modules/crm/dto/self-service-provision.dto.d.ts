export declare class SelfServiceProvisionDto {
    communityName: string;
    slug: string;
    tier: string;
    maxProperties: number;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    paymentMethod?: string;
    hasCustomDomain?: boolean;
    selectedAddons?: string[];
    honeypot?: string;
}
