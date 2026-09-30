import { DatabaseService } from '../../../database/database.service';
export declare class HealthController {
    private readonly db;
    constructor(db: DatabaseService);
    check(): Promise<{
        status: string;
        timestamp: string;
        services: {
            api: string;
            database: string;
            mqtt: string;
        };
    }>;
}
