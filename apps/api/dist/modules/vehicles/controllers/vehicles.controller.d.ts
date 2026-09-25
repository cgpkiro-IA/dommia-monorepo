import { VehiclesService } from '../services/vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from '../dto/vehicle.dto';
export declare class VehiclesController {
    private readonly vehiclesService;
    constructor(vehiclesService: VehiclesService);
    getVehicles(slug: string, propertyId?: string): Promise<{
        success: boolean;
        data: any[];
        count: number;
    }>;
    createVehicle(slug: string, dto: CreateVehicleDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    updateVehicle(slug: string, id: string, dto: UpdateVehicleDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    deleteVehicle(slug: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
