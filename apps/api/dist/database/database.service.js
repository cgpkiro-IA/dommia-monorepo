"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DatabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
let DatabaseService = DatabaseService_1 = class DatabaseService {
    pool;
    logger = new common_1.Logger(DatabaseService_1.name);
    async setTenantSearchPath(client, schemaName) {
        await client.query("SELECT set_config('search_path', $1, false)", [`${schemaName}, public`]);
    }
    constructor() {
        this.pool = new pg_1.Pool({
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
        let client;
        try {
            client = await this.pool.connect();
            const res = await client.query('SELECT current_database(), version()');
            this.logger.log(`Connected to PostgreSQL: ${res.rows[0].current_database}`);
        }
        catch (err) {
            this.logger.error('Failed to connect to PostgreSQL database', err);
        }
        finally {
            client?.release();
        }
    }
    async onModuleDestroy() {
        await this.pool.end();
    }
    async query(text, params) {
        const start = Date.now();
        const res = await this.pool.query(text, params);
        const duration = Date.now() - start;
        this.logger.debug(`Executed query [${duration}ms]: ${text.substring(0, 80)}`);
        return res;
    }
    async withTransaction(callback) {
        const client = await this.pool.connect();
        let releaseError;
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            try {
                await client.query('ROLLBACK');
            }
            catch (rollbackError) {
                releaseError = rollbackError instanceof Error ? rollbackError : new Error(String(rollbackError));
            }
            throw error;
        }
        finally {
            client.release(releaseError);
        }
    }
    async queryTenant(tenantSlug, text, params) {
        let cleanSlug = tenantSlug.toLowerCase().replace(/-/g, '_').replace(/[^a-z0-9_]/g, '_');
        if (cleanSlug === 'las_palmas' || cleanSlug === 'laspalmas') {
            cleanSlug = 'demo';
        }
        const schemaName = `tenant_${cleanSlug}`;
        const client = await this.pool.connect();
        let releaseError;
        try {
            await this.setTenantSearchPath(client, schemaName);
            const start = Date.now();
            const res = await client.query(text, params);
            const duration = Date.now() - start;
            this.logger.debug(`Executed tenant query [${schemaName}] [${duration}ms]`);
            return res;
        }
        finally {
            try {
                await client.query('RESET search_path');
            }
            catch (error) {
                releaseError = error instanceof Error ? error : new Error(String(error));
            }
            finally {
                client.release(releaseError);
            }
        }
    }
    async withTenantTransaction(tenantSlug, callback) {
        let cleanSlug = tenantSlug.toLowerCase().replace(/-/g, '_').replace(/[^a-z0-9_]/g, '_');
        if (cleanSlug === 'las_palmas' || cleanSlug === 'laspalmas')
            cleanSlug = 'demo';
        const client = await this.pool.connect();
        let releaseError;
        try {
            await this.setTenantSearchPath(client, `tenant_${cleanSlug}`);
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            try {
                await client.query('ROLLBACK');
            }
            catch (rollbackError) {
                releaseError = rollbackError instanceof Error ? rollbackError : new Error(String(rollbackError));
            }
            throw error;
        }
        finally {
            if (!releaseError) {
                try {
                    await client.query('RESET search_path');
                }
                catch (error) {
                    releaseError = error instanceof Error ? error : new Error(String(error));
                }
            }
            client.release(releaseError);
        }
    }
    async provisionTenant(slug, name, tier = 'STANDARD', maxProperties = 100, contactEmail) {
        const res = await this.query('SELECT public.provision_tenant_schema($1, $2, $3, $4, $5) AS id', [slug, name, tier, maxProperties, contactEmail]);
        await this.query('SELECT public.ensure_tenant_feature_tables($1)', [slug]);
        await this.query('SELECT public.ensure_tenant_finance_schema($1)', [slug]);
        await this.query('SELECT public.ensure_tenant_latest_guard_tables($1)', [slug]);
        const tenantId = res.rows[0].id;
        this.logger.log(`Provisioned tenant ${slug} with ID ${tenantId} and schema tenant_${slug}`);
        return tenantId;
    }
    async isHealthy() {
        try {
            const res = await this.pool.query('SELECT 1 as healthy');
            return res.rows[0]?.healthy === 1;
        }
        catch {
            return false;
        }
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = DatabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DatabaseService);
//# sourceMappingURL=database.service.js.map