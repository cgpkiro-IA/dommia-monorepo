import { ResidentsService } from '../services/residents.service';
import { CreateResidentDto, UpdateResidentDto } from '../dto/resident.dto';
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
}
