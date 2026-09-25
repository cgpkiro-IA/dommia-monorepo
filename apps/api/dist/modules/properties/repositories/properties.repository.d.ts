import { DatabaseService } from '../../../database/database.service';
export declare class PropertiesRepository {
    private readonly db;
    constructor(db: DatabaseService);
    findAllByTenant(slug: string): Promise<any[]>;
    countProperties(slug: string): Promise<number>;
    getResidentAndVehicleStats(slug: string): Promise<{
        residentStats: any;
        totalVehicles: any;
    }>;
    findById(slug: string, id: string): Promise<any>;
    create(slug: string, data: {
        street: string;
        exteriorNumber: string;
        interiorNumber?: string;
        block?: string;
        lot?: string;
        notes?: string;
    }): Promise<any>;
    update(slug: string, id: string, data: {
        street: string;
        exteriorNumber: string;
        interiorNumber?: string;
        block?: string;
        lot?: string;
        notes?: string;
        isDelinquent: boolean;
    }): Promise<any>;
    delete(slug: string, id: string): Promise<void>;
}
