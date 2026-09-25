import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { QueryResult, QueryResultRow } from 'pg';
export declare class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private pool;
    private readonly logger;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
    queryTenant<T extends QueryResultRow = any>(tenantSlug: string, text: string, params?: any[]): Promise<QueryResult<T>>;
    provisionTenant(slug: string, name: string, tier?: string, maxProperties?: number, contactEmail?: string): Promise<string>;
    isHealthy(): Promise<boolean>;
}
