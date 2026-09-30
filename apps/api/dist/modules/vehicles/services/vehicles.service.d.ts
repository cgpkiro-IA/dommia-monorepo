import { VehiclesRepository } from '../repositories/vehicles.repository';
import { TenantsRepository } from '../../tenants/repositories/tenants.repository';
import { CreateVehicleDto, UpdateVehicleDto } from '../dto/vehicle.dto';
export declare class VehiclesService {
    private readonly vehiclesRepo;
    private readonly tenantsRepo;
    constructor(vehiclesRepo: VehiclesRepository, tenantsRepo: TenantsRepository);
    private validateTenant;
    getTenantVehicles(slug: string, propertyId?: string): Promise<any[]>;
    createTenantVehicle(slug: string, dto: CreateVehicleDto): Promise<any>;
    updateTenantVehicle(slug: string, id: string, dto: UpdateVehicleDto): Promise<any>;
    deleteTenantVehicle(slug: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
