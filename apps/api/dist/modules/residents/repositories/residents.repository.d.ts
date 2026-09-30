import { DatabaseService } from '../../../database/database.service';
export declare class ResidentsRepository {
    private readonly db;
    constructor(db: DatabaseService);
    findAllByTenant(slug: string, propertyId?: string): Promise<any[]>;
    findById(slug: string, id: string): Promise<any>;
    checkPropertyExists(slug: string, propertyId: string): Promise<boolean>;
    checkEmailExists(slug: string, email: string, excludeId?: string): Promise<boolean>;
    resetPrimaryForProperty(slug: string, propertyId: string, excludeId?: string): Promise<void>;
    create(slug: string, data: {
        propertyId: string;
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string | null;
        role: string;
        isPrimary: boolean;
        password: string;
        isActive?: boolean;
    }): Promise<any>;
    update(slug: string, id: string, data: {
        propertyId: string;
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string | null;
        role: string;
        isPrimary: boolean;
        isActive: boolean;
    }): Promise<void>;
    delete(slug: string, id: string): Promise<void>;
}
