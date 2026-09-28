import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private readonly logger = new Logger(DatabaseService.name);

  private async setTenantSearchPath(client: PoolClient, schemaName: string) {
    await client.query("SELECT set_config('search_path', $1, false)", [`${schemaName}, public`]);
  }

  constructor() {
    this.pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      user: process.env.POSTGRES_USER || 'dommia_admin',
      password: process.env.POSTGRES_PASSWORD || 'dommia_secret_2026',
      database: process.env.POSTGRES_DB || 'dommia_master',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  async onModuleInit() {
    let client: PoolClient | undefined;
    try {
      client = await this.pool.connect();
      const res = await client.query('SELECT current_database(), version()');
      this.logger.log(`Connected to PostgreSQL: ${res.rows[0].current_database}`);
    } catch (err) {
      this.logger.error('Failed to connect to PostgreSQL database', err);
    } finally {
      client?.release();
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  /**
   * Execute a query against the global/public schema
   */
  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    const res = await this.pool.query<T>(text, params);
    const duration = Date.now() - start;
    this.logger.debug(`Executed query [${duration}ms]: ${text.substring(0, 80)}`);
    return res;
  }

  /**
   * Execute a query inside a specific tenant's schema in PostgreSQL
   * Dynamically switches search_path = tenant_<slug>, public
   */
  async queryTenant<T extends QueryResultRow = any>(
    tenantSlug: string,
    text: string,
    params?: any[],
  ): Promise<QueryResult<T>> {
    let cleanSlug = tenantSlug.toLowerCase().replace(/-/g, '_').replace(/[^a-z0-9_]/g, '_');
    if (cleanSlug === 'las_palmas' || cleanSlug === 'laspalmas') {
      cleanSlug = 'demo';
    }
    const schemaName = `tenant_${cleanSlug}`;
    const client: PoolClient = await this.pool.connect();
    let releaseError: Error | undefined;

    try {
      await this.setTenantSearchPath(client, schemaName);
      const start = Date.now();
      const res = await client.query<T>(text, params);
      const duration = Date.now() - start;
      this.logger.debug(`Executed tenant query [${schemaName}] [${duration}ms]`);
      return res;
    } finally {
      try {
        await client.query('RESET search_path');
      } catch (error) {
        releaseError = error instanceof Error ? error : new Error(String(error));
      } finally {
        client.release(releaseError);
      }
    }
  }

  async withTenantTransaction<T>(tenantSlug: string, callback: (client: PoolClient) => Promise<T>): Promise<T> {
    let cleanSlug = tenantSlug.toLowerCase().replace(/-/g, '_').replace(/[^a-z0-9_]/g, '_');
    if (cleanSlug === 'las_palmas' || cleanSlug === 'laspalmas') cleanSlug = 'demo';
    const client = await this.pool.connect();
    let releaseError: Error | undefined;
    try {
      await this.setTenantSearchPath(client, `tenant_${cleanSlug}`);
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        releaseError = rollbackError instanceof Error ? rollbackError : new Error(String(rollbackError));
      }
      throw error;
    } finally {
      if (!releaseError) {
        try {
          await client.query('RESET search_path');
        } catch (error) {
          releaseError = error instanceof Error ? error : new Error(String(error));
        }
      }
      client.release(releaseError);
    }
  }

  /**
   * Provision a brand new tenant with its dedicated schema and tables
   */
  async provisionTenant(
    slug: string,
    name: string,
    tier: string = 'STANDARD',
    maxProperties: number = 100,
    contactEmail?: string,
  ): Promise<string> {
    const res = await this.query<{ id: string }>(
      'SELECT public.provision_tenant_schema($1, $2, $3, $4, $5) AS id',
      [slug, name, tier, maxProperties, contactEmail],
    );
    await this.query('SELECT public.ensure_tenant_feature_tables($1)', [slug]);
    const tenantId = res.rows[0].id;
    this.logger.log(`Provisioned tenant ${slug} with ID ${tenantId} and schema tenant_${slug}`);
    return tenantId;
  }

  /**
   * Check connection health
   */
  async isHealthy(): Promise<boolean> {
    try {
      const res = await this.pool.query('SELECT 1 as healthy');
      return res.rows[0]?.healthy === 1;
    } catch {
      return false;
    }
  }
}
