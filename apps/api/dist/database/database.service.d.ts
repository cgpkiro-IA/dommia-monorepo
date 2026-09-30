import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PoolClient, QueryResult, QueryResultRow } from 'pg';
export declare class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private pool;
    private readonly logger;
    private setTenantSearchPath;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
    withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
    queryTenant<T extends QueryResultRow = any>(tenantSlug: string, text: string, params?: any[]): Promise<QueryResult<T>>;
    withTenantTransaction<T>(tenantSlug: string, callback: (client: PoolClient) => Promise<T>): Promise<T>;
    provisionTenant(slug: string, name: string, tier?: string, maxProperties?: number, contactEmail?: string): Promise<string>;
    isHealthy(): Promise<boolean>;
}
