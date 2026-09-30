import { DatabaseService } from '../../../database/database.service';
export declare class VehiclesRepository {
    private readonly db;
    constructor(db: DatabaseService);
    findAllByTenant(slug: string, propertyId?: string): Promise<any[]>;
    findById(slug: string, id: string): Promise<any>;
    checkPropertyExists(slug: string, propertyId: string): Promise<boolean>;
    checkPlatesExists(slug: string, plates: string, excludeId?: string): Promise<boolean>;
    create(slug: string, data: {
        propertyId: string;
        residentId: string | null;
        plates: string;
        brand: string | null;
        model: string | null;
        color: string | null;
    }): Promise<any>;
    update(slug: string, id: string, data: {
        propertyId: string;
        residentId: string | null;
        plates: string;
        brand: string | null;
        model: string | null;
        color: string | null;
    }): Promise<void>;
    delete(slug: string, id: string): Promise<void>;
}
