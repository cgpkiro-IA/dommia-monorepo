import { DatabaseService } from '../../../database/database.service';
export declare class AuthRepository {
    private readonly db;
    constructor(db: DatabaseService);
    findUserByEmailAndPassword(email: string, passwordPlain: string): Promise<any>;
    findAllActiveTenants(): Promise<any[]>;
    findTenantsByUser(userId: string, userRole: string, tenantId?: string): Promise<any[]>;
}
