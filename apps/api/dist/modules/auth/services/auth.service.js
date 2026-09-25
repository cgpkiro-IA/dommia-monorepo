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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const auth_repository_1 = require("../repositories/auth.repository");
let AuthService = AuthService_1 = class AuthService {
    authRepo;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(authRepo) {
        this.authRepo = authRepo;
    }
    async login(dto) {
        const email = dto.email.trim().toLowerCase();
        const user = await this.authRepo.findUserByEmailAndPassword(email, dto.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Credenciales inválidas. Verifica tu correo y contraseña.');
        }
        if (!user.is_active) {
            throw new common_1.UnauthorizedException('Tu cuenta se encuentra inactiva. Contacta al administrador.');
        }
        let tenantList = [];
        if (user.role === 'SUPER_ADMIN') {
            const allTenants = await this.authRepo.findAllActiveTenants();
            tenantList = allTenants.map((t) => ({
                id: t.id,
                slug: t.slug,
                name: t.name,
                tier: t.tier,
                maxProperties: t.max_properties,
                hasCustomDomain: t.has_custom_domain,
                customDomain: t.custom_domain,
                accessUrl: t.access_url,
                role: 'SUPER_ADMIN',
            }));
        }
        else {
            const userTenants = await this.authRepo.findTenantsByUser(user.id, user.role, user.tenant_id);
            tenantList = userTenants.map((t) => ({
                id: t.id,
                slug: t.slug,
                name: t.name,
                tier: t.tier,
                maxProperties: t.max_properties,
                hasCustomDomain: t.has_custom_domain,
                customDomain: t.custom_domain,
                accessUrl: t.access_url,
                role: t.role,
            }));
        }
        let activeTenant = null;
        if (dto.tenantSlug) {
            const match = tenantList.find((t) => t.slug.toLowerCase() === dto.tenantSlug?.toLowerCase());
            if (match) {
                activeTenant = match;
            }
        }
        if (!activeTenant && tenantList.length === 1) {
            activeTenant = tenantList[0];
        }
        const token = Buffer.from(JSON.stringify({
            sub: user.id,
            email: user.email,
            role: user.role,
            tenantId: activeTenant?.id || null,
            tenantSlug: activeTenant?.slug || null,
            exp: Date.now() + 24 * 60 * 60 * 1000,
        })).toString('base64');
        this.logger.log(`Login exitoso: ${user.email} (Comunidades vinculadas: ${tenantList.length}, Activo: ${activeTenant?.slug || 'PENDIENTE_SELECCION'})`);
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
            },
            tenants: tenantList,
            activeTenant,
            token,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_repository_1.AuthRepository])
], AuthService);
//# sourceMappingURL=auth.service.js.map