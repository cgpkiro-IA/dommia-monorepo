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
        try {
            const client = await this.pool.connect();
            const res = await client.query('SELECT current_database(), version()');
            this.logger.log(`Connected to PostgreSQL: ${res.rows[0].current_database}`);
            client.release();
        }
        catch (err) {
            this.logger.error('Failed to connect to PostgreSQL database', err);
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
    async queryTenant(tenantSlug, text, params) {
        let cleanSlug = tenantSlug.toLowerCase().replace(/-/g, '_').replace(/[^a-z0-9_]/g, '_');
        if (cleanSlug === 'las_palmas' || cleanSlug === 'laspalmas') {
            cleanSlug = 'demo';
        }
        const schemaName = `tenant_${cleanSlug}`;
        const client = await this.pool.connect();
        try {
            await client.query(`SET search_path = "${schemaName}", public;`);
            const start = Date.now();
            const res = await client.query(text, params);
            const duration = Date.now() - start;
            this.logger.debug(`Executed tenant query [${schemaName}] [${duration}ms]`);
            return res;
        }
        finally {
            await client.query('SET search_path = public;');
            client.release();
        }
    }
    async provisionTenant(slug, name, tier = 'STANDARD', maxProperties = 100, contactEmail) {
        const res = await this.query('SELECT public.provision_tenant_schema($1, $2, $3, $4, $5) AS id', [slug, name, tier, maxProperties, contactEmail]);
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