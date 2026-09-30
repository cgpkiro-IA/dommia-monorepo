export declare class CreatePropertyDto {
    street: string;
    exteriorNumber: string;
    interiorNumber?: string;
    block?: string;
    lot?: string;
    notes?: string;
}
export declare class UpdatePropertyDto {
    street?: string;
    exteriorNumber?: string;
    interiorNumber?: string;
    block?: string;
    lot?: string;
    notes?: string;
    isDelinquent?: boolean;
}
