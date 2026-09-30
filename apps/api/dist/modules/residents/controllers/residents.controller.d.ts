import { ResidentsService } from '../services/residents.service';
import { CreateResidentDto, InviteResidentsDto, UpdateResidentDto } from '../dto/resident.dto';
export declare class ResidentsController {
    private readonly residentsService;
    constructor(residentsService: ResidentsService);
    getResidents(slug: string, propertyId?: string): Promise<{
        success: boolean;
        data: any[];
        count: number;
    }>;
    createResident(slug: string, dto: CreateResidentDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    updateResident(slug: string, id: string, dto: UpdateResidentDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    deleteResident(slug: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    inviteResident(slug: string, id: string, body: {
        createdBy?: string;
        contactMethod?: 'AUTO' | 'EMAIL' | 'PHONE';
        delivery?: 'NONE' | 'EMAIL' | 'WHATSAPP';
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            residentId: string;
            activationToken: any;
            expiresAt: any;
            contactMethod: string;
            loginIdentifier: any;
            tenantSlug: string;
            activationPath: string;
            delivery: "EMAIL" | "NONE" | "WHATSAPP";
        };
    }>;
    inviteResidents(slug: string, dto: InviteResidentsDto): Promise<{
        success: boolean;
        message: string;
        data: {
            residentId: any;
            residentName: string;
            email: any;
            phone: any;
            contactMethod: string;
            loginIdentifier: any;
            tenantSlug: string;
            activationToken: any;
            expiresAt: any;
            activationPath: any;
            delivery: any;
        }[];
    }>;
}
