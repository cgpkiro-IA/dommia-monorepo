import { ResidentsRepository } from '../repositories/residents.repository';
import { TenantsRepository } from '../../tenants/repositories/tenants.repository';
import { CreateResidentDto, InviteResidentsDto, UpdateResidentDto } from '../dto/resident.dto';
import { AuthRepository } from '../../auth/repositories/auth.repository';
import { NotificationDeliveryService } from '../../notifications/services/notification-delivery.service';
export declare class ResidentsService {
    private readonly residentsRepo;
    private readonly tenantsRepo;
    private readonly authRepo;
    private readonly notificationDelivery;
    constructor(residentsRepo: ResidentsRepository, tenantsRepo: TenantsRepository, authRepo: AuthRepository, notificationDelivery: NotificationDeliveryService);
    private validateTenant;
    getTenantResidents(slug: string, propertyId?: string): Promise<any[]>;
    createTenantResident(slug: string, dto: CreateResidentDto): Promise<any>;
    updateTenantResident(slug: string, id: string, dto: UpdateResidentDto): Promise<any>;
    deleteTenantResident(slug: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private resolveInvitationContact;
    inviteTenantResident(slug: string, id: string, createdBy?: string, contactMethod?: 'AUTO' | 'EMAIL' | 'PHONE', delivery?: 'NONE' | 'EMAIL' | 'WHATSAPP'): Promise<{
        residentId: string;
        activationToken: any;
        expiresAt: any;
        contactMethod: string;
        loginIdentifier: any;
        tenantSlug: string;
        activationPath: string;
        delivery: "EMAIL" | "NONE" | "WHATSAPP";
    }>;
    inviteTenantResidents(slug: string, dto: InviteResidentsDto): Promise<{
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
    }[]>;
}
