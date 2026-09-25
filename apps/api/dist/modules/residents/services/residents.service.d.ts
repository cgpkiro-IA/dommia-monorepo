import { ResidentsRepository } from '../repositories/residents.repository';
import { TenantsRepository } from '../../tenants/repositories/tenants.repository';
import { CreateResidentDto, UpdateResidentDto } from '../dto/resident.dto';
export declare class ResidentsService {
    private readonly residentsRepo;
    private readonly tenantsRepo;
    constructor(residentsRepo: ResidentsRepository, tenantsRepo: TenantsRepository);
    private validateTenant;
    getTenantResidents(slug: string, propertyId?: string): Promise<any[]>;
    createTenantResident(slug: string, dto: CreateResidentDto): Promise<any>;
    updateTenantResident(slug: string, id: string, dto: UpdateResidentDto): Promise<any>;
    deleteTenantResident(slug: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
