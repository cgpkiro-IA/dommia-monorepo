export declare class UpdatePlanDto {
    name?: string;
    description?: string;
    monthlyPrice?: number;
    maxProperties?: number;
    pricePerExtraProperty?: number;
    includesCustomDomain?: boolean;
    customDomainAddonPrice?: number;
    includedModules?: string[];
    availableAddons?: Array<{
        code: string;
        name: string;
        price: number;
    }>;
    isActive?: boolean;
    isHighlighted?: boolean;
}
