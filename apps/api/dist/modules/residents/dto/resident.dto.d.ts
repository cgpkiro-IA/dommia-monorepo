export declare class CreateResidentDto {
    propertyId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    role?: string;
    isPrimary?: boolean;
    password?: string;
    isActive?: boolean;
}
export declare class UpdateResidentDto {
    propertyId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    role?: string;
    isPrimary?: boolean;
    isActive?: boolean;
}
export declare class InviteResidentsDto {
    residentIds?: string[] | 'ALL';
    all?: boolean;
    createdBy?: string;
    contactMethod?: 'AUTO' | 'EMAIL' | 'PHONE';
    delivery?: 'NONE' | 'EMAIL' | 'WHATSAPP';
}
export declare class InviteResidentDto {
    createdBy?: string;
    contactMethod?: 'AUTO' | 'EMAIL' | 'PHONE';
    delivery?: 'NONE' | 'EMAIL' | 'WHATSAPP';
}
