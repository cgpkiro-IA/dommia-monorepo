import { DatabaseService } from '../../../database/database.service';
import { CreateFeeConfigurationDto, UpdateFeeConfigurationDto } from '../dto/fee-configuration.dto';
export declare class FeeConfigurationRepository {
    private readonly db;
    constructor(db: DatabaseService);
    findAllByTenant(slug: string, activeOnly?: boolean): Promise<any[]>;
    findById(slug: string, id: string): Promise<any>;
    create(slug: string, dto: CreateFeeConfigurationDto): Promise<any>;
    update(slug: string, id: string, dto: UpdateFeeConfigurationDto): Promise<any>;
    delete(slug: string, id: string): Promise<boolean>;
    getPropertiesForSimulation(slug: string): Promise<any[]>;
}
