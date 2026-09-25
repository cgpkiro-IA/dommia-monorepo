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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../../database/database.service");
let AuthRepository = class AuthRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findUserByEmailAndPassword(email, passwordPlain) {
        const res = await this.db.query(`SELECT 
        u.id, 
        u.email, 
        u.first_name, 
        u.last_name, 
        u.role, 
        u.tenant_id,
        u.is_active
       FROM public.users u
       WHERE LOWER(u.email) = $1 
         AND u.password_hash = crypt($2, u.password_hash)`, [email.toLowerCase(), passwordPlain]);
        return res.rows[0] || null;
    }
    async findAllActiveTenants() {
        const res = await this.db.query(`SELECT id, slug, name, tier, max_properties, has_custom_domain, custom_domain, access_url
       FROM public.tenants
       WHERE is_active = true
       ORDER BY name ASC`);
        return res.rows;
    }
    async findTenantsByUser(userId, userRole, tenantId) {
        const res = await this.db.query(`SELECT DISTINCT
        t.id, 
        t.slug, 
        t.name, 
        t.tier, 
        t.max_properties, 
        t.has_custom_domain, 
        t.custom_domain, 
        t.access_url,
        COALESCE(ut.role, $2) as role
       FROM public.tenants t
       LEFT JOIN public.user_tenants ut ON ut.tenant_id = t.id AND ut.user_id = $1
       WHERE (ut.user_id = $1 OR t.id = $3)
         AND t.is_active = true
       ORDER BY t.name ASC`, [userId, userRole, tenantId || '00000000-0000-0000-0000-000000000000']);
        return res.rows;
    }
};
exports.AuthRepository = AuthRepository;
exports.AuthRepository = AuthRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], AuthRepository);
//# sourceMappingURL=auth.repository.js.map