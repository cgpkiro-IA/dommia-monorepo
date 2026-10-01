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
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const crypto_1 = require("crypto");
const OTPAuth = require("otpauth");
const QRCode = require("qrcode");
const auth_repository_1 = require("../repositories/auth.repository");
const notification_delivery_service_1 = require("../../notifications/services/notification-delivery.service");
const resident_rate_limiter_1 = require("./resident-rate-limiter");
const RESIDENT_APP_ACCESS_TTL_SECONDS = 15 * 60;
const RESIDENT_APP_REFRESH_IDLE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const RESIDENT_APP_REFRESH_ABSOLUTE_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const RESIDENT_APP_ISSUER = 'dommia-api';
const RESIDENT_APP_AUDIENCE = 'dommia-resident-api';
let AuthService = AuthService_1 = class AuthService {
    config;
    jwtService;
    authRepo;
    notificationDelivery;
    residentRateLimiter;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(config, jwtService, authRepo, notificationDelivery, residentRateLimiter) {
        this.config = config;
        this.jwtService = jwtService;
        this.authRepo = authRepo;
        this.notificationDelivery = notificationDelivery;
        this.residentRateLimiter = residentRateLimiter;
    }
    signClaims(claims) {
        const expiresAt = claims.exp;
        if (typeof expiresAt !== 'number')
            throw new Error('El token requiere una expiración válida.');
        return this.jwtService.sign({
            ...claims,
            exp: Math.floor(expiresAt / 1000),
        }, {
            secret: this.config.getOrThrow('AUTH_TOKEN_SECRET'),
            algorithm: 'HS256',
        });
    }
    verifySignedClaims(token) {
        try {
            return this.jwtService.verify(token, {
                secret: this.config.getOrThrow('AUTH_TOKEN_SECRET'),
                algorithms: ['HS256'],
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Desafío MFA inválido o expirado.');
        }
    }
    encryptionKey() {
        const configuredKey = this.config.get('MFA_ENCRYPTION_KEY');
        return configuredKey
            ? Buffer.from(configuredKey, 'hex')
            : (0, crypto_1.createHash)('sha256').update(this.config.getOrThrow('AUTH_TOKEN_SECRET')).digest();
    }
    encryptSecret(secret) {
        const iv = (0, crypto_1.randomBytes)(12);
        const cipher = (0, crypto_1.createCipheriv)('aes-256-gcm', this.encryptionKey(), iv);
        const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
        return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64url')).join('.');
    }
    decryptSecret(encryptedSecret) {
        const [encodedIv, encodedTag, encodedCiphertext] = encryptedSecret.split('.');
        if (!encodedIv || !encodedTag || !encodedCiphertext)
            throw new Error('El secreto MFA almacenado no es válido.');
        const decipher = (0, crypto_1.createDecipheriv)('aes-256-gcm', this.encryptionKey(), Buffer.from(encodedIv, 'base64url'));
        decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'));
        return Buffer.concat([
            decipher.update(Buffer.from(encodedCiphertext, 'base64url')),
            decipher.final(),
        ]).toString('utf8');
    }
    validateTotp(secretBase32, code) {
        const totp = new OTPAuth.TOTP({
            issuer: 'Dommia',
            label: 'Administrador',
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(secretBase32),
        });
        const delta = totp.validate({ token: code.replace(/\s/g, ''), window: 1 });
        return delta === null ? null : OTPAuth.TOTP.counter({ period: 30 }) + delta;
    }
    signResidentAppAccessToken(session, propertyId) {
        const issuedAt = Math.floor(Date.now() / 1000);
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: 'resident-hs256-v1' })).toString('base64url');
        const payload = Buffer.from(JSON.stringify({
            iss: RESIDENT_APP_ISSUER,
            aud: RESIDENT_APP_AUDIENCE,
            sub: session.residentId,
            role: 'RESIDENT',
            tenantSlug: session.tenantSlug,
            propertyId,
            sid: session.id,
            jti: session.jti,
            clientType: session.clientType,
            iat: issuedAt,
            exp: issuedAt + RESIDENT_APP_ACCESS_TTL_SECONDS,
        })).toString('base64url');
        const signingInput = `${header}.${payload}`;
        const signature = (0, crypto_1.createHmac)('sha256', this.residentAppSigningKey())
            .update(signingInput)
            .digest('base64url');
        return `${signingInput}.${signature}`;
    }
    residentAppSigningKey() {
        return this.config.getOrThrow('RESIDENT_APP_TOKEN_SECRET');
    }
    async createResidentAppTokenResponse(session, refreshToken, refreshExpiresAt) {
        const resident = await this.authRepo.findResidentProfile(session.tenantSlug, session.residentId);
        if (!resident?.is_active) {
            await this.authRepo.revokeResidentSession(session.jti);
            throw new common_1.UnauthorizedException('La sesión Resident ya no es válida.');
        }
        const accessToken = this.signResidentAppAccessToken(session, resident.property_id);
        return {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: RESIDENT_APP_ACCESS_TTL_SECONDS,
            refreshExpiresAt: refreshExpiresAt.toISOString(),
            resident,
            tenantSlug: session.tenantSlug,
            clientType: session.clientType,
            deviceId: session.deviceId || null,
            deviceName: session.deviceName || null,
        };
    }
    async residentAppLogin(dto) {
        const identifier = dto.identifier.trim();
        this.assertResidentRateLimit('app-login', `${dto.tenantSlug}:${identifier}`);
        const resident = await this.authRepo.findResidentByCredentials(dto.tenantSlug, identifier, dto.password);
        if (!resident || !resident.is_active)
            throw new common_1.UnauthorizedException('Credenciales Resident inválidas.');
        if (resident.must_change_password) {
            return { passwordChangeRequired: true, tenantSlug: dto.tenantSlug };
        }
        const now = Date.now();
        const refreshToken = (0, crypto_1.randomBytes)(32).toString('base64url');
        const refreshExpiresAt = new Date(now + RESIDENT_APP_REFRESH_IDLE_TTL_MS);
        const refreshAbsoluteExpiresAt = new Date(now + RESIDENT_APP_REFRESH_ABSOLUTE_TTL_MS);
        const session = await this.authRepo.createResidentAppSession({
            jti: (0, crypto_1.randomUUID)(),
            residentId: resident.id,
            tenantSlug: dto.tenantSlug,
            clientType: dto.clientType,
            deviceId: dto.deviceId,
            deviceName: dto.deviceName,
            refreshTokenHash: (0, crypto_1.createHash)('sha256').update(refreshToken).digest('hex'),
            refreshExpiresAt,
            refreshAbsoluteExpiresAt,
        });
        await this.authRepo.recordResidentAudit(dto.tenantSlug, 'APP_LOGIN', resident.id, { clientType: dto.clientType });
        return this.createResidentAppTokenResponse({
            ...session,
            residentId: resident.id,
            tenantSlug: dto.tenantSlug,
            clientType: dto.clientType,
            deviceId: dto.deviceId,
            deviceName: dto.deviceName,
        }, refreshToken, refreshExpiresAt);
    }
    async residentAppChangePassword(dto) {
        this.assertResidentRateLimit('app-password-change', `${dto.tenantSlug}:${dto.identifier}`);
        this.validateResidentPassword(dto.newPassword);
        const resident = await this.authRepo.changeResidentPassword(dto.tenantSlug, dto.identifier.trim(), dto.currentPassword, dto.newPassword);
        if (!resident)
            throw new common_1.UnauthorizedException('La contraseña temporal o las credenciales no son válidas.');
        const revokedSessions = await this.authRepo.revokeAllResidentAppSessions(resident.id, dto.tenantSlug);
        await this.authRepo.recordResidentAudit(dto.tenantSlug, 'APP_PASSWORD_CHANGE', resident.id);
        return { revokedSessions };
    }
    async residentAppRefresh(refreshToken) {
        this.assertResidentRateLimit('app-refresh', (0, crypto_1.createHash)('sha256').update(refreshToken).digest('hex'));
        const nextRefreshToken = (0, crypto_1.randomBytes)(32).toString('base64url');
        const result = await this.authRepo.rotateResidentAppRefreshToken((0, crypto_1.createHash)('sha256').update(refreshToken).digest('hex'), (0, crypto_1.createHash)('sha256').update(nextRefreshToken).digest('hex'));
        if (result.kind === 'REPLAY') {
            await this.authRepo.recordResidentAudit(result.tenantSlug, 'APP_REFRESH_REUSE_DETECTED', result.residentId, {
                clientType: result.clientType,
            });
        }
        if (result.kind !== 'ROTATED') {
            throw new common_1.UnauthorizedException('La sesión móvil venció, fue revocada o requiere iniciar sesión de nuevo.');
        }
        return this.createResidentAppTokenResponse(result.session, nextRefreshToken, result.refreshExpiresAt);
    }
    async residentAppResetPassword(dto) {
        this.assertResidentRateLimit('app-reset', dto.token);
        this.validateResidentPassword(dto.newPassword);
        const resident = await this.authRepo.resetResidentPassword(dto.token, dto.newPassword);
        if (!resident)
            throw new common_1.UnauthorizedException('El enlace de recuperación es inválido, expiró o ya fue utilizado.');
        const revokedSessions = await this.authRepo.revokeAllResidentAppSessions(resident.id, resident.tenantSlug);
        await this.authRepo.recordResidentAudit(resident.tenantSlug, 'APP_PASSWORD_RESET', resident.id, { revokedSessions });
        return {
            success: true,
            message: 'Contraseña recuperada correctamente. Inicia sesión nuevamente.',
            data: { resident, revokedSessions },
        };
    }
    async residentAppLogout(jti) {
        await this.authRepo.revokeResidentSession(jti);
        return { success: true };
    }
    async listResidentAppSessions(residentId, tenantSlug, currentJti) {
        return this.authRepo.listResidentAppSessions(residentId, tenantSlug, currentJti);
    }
    async revokeResidentAppSession(sessionId, residentId, tenantSlug) {
        const revoked = await this.authRepo.revokeResidentAppSession(sessionId, residentId, tenantSlug);
        if (!revoked)
            throw new common_1.NotFoundException('La sesión no existe o ya fue revocada.');
        return { success: true };
    }
    validateResidentPassword(password) {
        const isStrong = password.length >= 10
            && /[A-Z]/.test(password)
            && /[a-z]/.test(password)
            && /\d/.test(password)
            && /[^A-Za-z0-9]/.test(password);
        if (!isStrong) {
            throw new common_1.BadRequestException('La contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula, un número y un símbolo.');
        }
    }
    assertResidentRateLimit(action, identifier) {
        this.residentRateLimiter.assertAllowed(action, identifier, 8, 15 * 60 * 1000);
    }
    async login(dto) {
        const email = dto.email.trim().toLowerCase();
        this.residentRateLimiter.assertAllowed('admin-login', email, 8, 15 * 60 * 1000);
        const user = await this.authRepo.findUserByEmailAndPassword(email, dto.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Credenciales inválidas. Verifica tu correo y contraseña.');
        }
        if (!user.is_active) {
            throw new common_1.UnauthorizedException('Tu cuenta se encuentra inactiva. Contacta al administrador.');
        }
        if (user.mfa_enabled) {
            const expiresAt = Date.now() + 5 * 60 * 1000;
            const challengeId = await this.authRepo.createMfaChallenge(user.id, new Date(expiresAt));
            if (!challengeId)
                throw new common_1.HttpException('Demasiados intentos de acceso. Intenta nuevamente en 15 minutos.', common_1.HttpStatus.TOO_MANY_REQUESTS);
            return {
                mfaRequired: true,
                challengeToken: this.signClaims({
                    sub: user.id,
                    role: 'MFA_PENDING',
                    purpose: 'mfa_login',
                    challengeId,
                    tenantSlug: dto.tenantSlug || null,
                    exp: expiresAt,
                }),
                expiresIn: 300,
            };
        }
        return this.createAuthSession(user, dto.tenantSlug);
    }
    async createAuthSession(user, requestedTenantSlug) {
        let tenantList = [];
        if (user.role === 'SUPER_ADMIN') {
            const allTenants = await this.authRepo.findAllActiveTenants();
            tenantList = allTenants.map((t) => ({
                id: t.id,
                slug: t.slug,
                name: t.name,
                tier: t.tier,
                maxProperties: t.max_properties,
                modules: t.modules || [],
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
                modules: t.modules || [],
                hasCustomDomain: t.has_custom_domain,
                customDomain: t.custom_domain,
                accessUrl: t.access_url,
                role: t.role,
            }));
        }
        let activeTenant = null;
        if (requestedTenantSlug) {
            const match = tenantList.find((t) => t.slug.toLowerCase() === requestedTenantSlug.toLowerCase());
            if (match) {
                activeTenant = match;
            }
        }
        if (!activeTenant && tenantList.length === 1) {
            activeTenant = tenantList[0];
        }
        const token = this.signClaims({
            sub: user.id,
            email: user.email,
            role: activeTenant?.role || user.role,
            tenantId: activeTenant?.id || null,
            tenantSlug: activeTenant?.slug || null,
            exp: Date.now() + 24 * 60 * 60 * 1000,
        });
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
    async verifyMfaLogin(challengeToken, code) {
        const claims = this.verifySignedClaims(challengeToken);
        if (claims.purpose !== 'mfa_login' || claims.role !== 'MFA_PENDING'
            || typeof claims.sub !== 'string' || typeof claims.challengeId !== 'string') {
            throw new common_1.UnauthorizedException('Desafío MFA inválido o expirado.');
        }
        const challenge = await this.authRepo.findActiveMfaChallenge(claims.challengeId, claims.sub);
        const user = await this.authRepo.findUserForMfa(claims.sub);
        if (!challenge || !user?.is_active || !user.mfa_enabled || !user.mfa_secret_encrypted) {
            throw new common_1.UnauthorizedException('Desafío MFA inválido o expirado.');
        }
        const step = this.validateTotp(this.decryptSecret(user.mfa_secret_encrypted), code);
        if (step === null) {
            await this.authRepo.recordFailedMfaChallenge(claims.challengeId);
            throw new common_1.UnauthorizedException('El código de autenticación no es válido.');
        }
        if (!await this.authRepo.consumeMfaChallenge(claims.challengeId, claims.sub)
            || !await this.authRepo.consumeMfaStep(claims.sub, step)) {
            throw new common_1.UnauthorizedException('El código ya fue utilizado. Solicita un nuevo inicio de sesión.');
        }
        return this.createAuthSession(user, typeof claims.tenantSlug === 'string' ? claims.tenantSlug : undefined);
    }
    async getMfaStatus(userId) {
        const settings = await this.authRepo.getMfaSettings(userId);
        if (!settings)
            throw new common_1.UnauthorizedException('La cuenta no está activa.');
        return { enabled: Boolean(settings.mfa_enabled), setupPending: Boolean(settings.mfa_pending_secret_encrypted) };
    }
    async startMfaSetup(userId, password) {
        if (!await this.authRepo.verifyUserPassword(userId, password)) {
            throw new common_1.UnauthorizedException('La contraseña actual no es válida.');
        }
        const user = await this.authRepo.findUserForMfa(userId);
        if (!user?.is_active)
            throw new common_1.UnauthorizedException('La cuenta no está activa.');
        if (user.mfa_enabled)
            throw new common_1.BadRequestException('La autenticación de dos pasos ya está activada.');
        const secret = new OTPAuth.Secret({ size: 20 });
        const totp = new OTPAuth.TOTP({
            issuer: 'Dommia',
            label: user.email,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret,
        });
        await this.authRepo.savePendingMfaSecret(userId, this.encryptSecret(secret.base32));
        return {
            secret: secret.base32,
            qrCodeDataUrl: await QRCode.toDataURL(totp.toString(), { width: 220, margin: 2 }),
            expiresIn: 600,
        };
    }
    async enableMfa(userId, code) {
        const settings = await this.authRepo.getMfaSettings(userId);
        if (!settings?.mfa_pending_secret_encrypted || !settings.mfa_pending_created_at
            || Date.now() - new Date(settings.mfa_pending_created_at).getTime() > 10 * 60 * 1000) {
            throw new common_1.BadRequestException('La configuración expiró. Inicia de nuevo el registro del autenticador.');
        }
        const step = this.validateTotp(this.decryptSecret(settings.mfa_pending_secret_encrypted), code);
        if (step === null || !await this.authRepo.enableMfa(userId, step)) {
            throw new common_1.UnauthorizedException('El código no es válido o la configuración expiró.');
        }
        return { enabled: true };
    }
    async disableMfa(userId, password, code) {
        if (!await this.authRepo.verifyUserPassword(userId, password)) {
            throw new common_1.UnauthorizedException('La contraseña actual no es válida.');
        }
        const settings = await this.authRepo.getMfaSettings(userId);
        if (!settings?.mfa_enabled || !settings.mfa_secret_encrypted) {
            throw new common_1.BadRequestException('La autenticación de dos pasos no está activada.');
        }
        const step = this.validateTotp(this.decryptSecret(settings.mfa_secret_encrypted), code);
        if (step === null || !await this.authRepo.disableMfa(userId, step)) {
            throw new common_1.UnauthorizedException('El código de autenticación no es válido o ya fue utilizado.');
        }
        return { enabled: false };
    }
    async selectTenant(userId, tenantSlug) {
        const user = await this.authRepo.findUserForMfa(userId);
        if (!user?.is_active)
            throw new common_1.UnauthorizedException('La sesión ya no es válida.');
        const session = await this.createAuthSession(user, tenantSlug);
        if (!session.activeTenant)
            throw new common_1.ForbiddenException('No tienes acceso al fraccionamiento seleccionado.');
        return session;
    }
    async residentLogin(dto) {
        const identifier = (dto.identifier || dto.email || '').trim();
        this.assertResidentRateLimit('login', identifier);
        const resident = await this.authRepo.findResidentByCredentials(dto.tenantSlug, identifier, dto.password);
        if (!resident || !resident.is_active)
            throw new common_1.UnauthorizedException('Credenciales Resident inválidas.');
        await this.authRepo.recordResidentAudit(dto.tenantSlug, 'LOGIN', resident.id, { identifierType: dto.identifier?.includes('@') || dto.email?.includes('@') ? 'EMAIL' : 'PHONE' });
        const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
        const jti = (0, crypto_1.randomUUID)();
        await this.authRepo.createResidentSession(jti, resident.id, dto.tenantSlug, new Date(expiresAt));
        const token = this.signClaims({ sub: resident.id, email: resident.email, role: 'RESIDENT', tenantSlug: dto.tenantSlug, propertyId: resident.property_id, mustChangePassword: resident.must_change_password, jti, exp: expiresAt });
        return { token, mustChangePassword: resident.must_change_password, resident, tenantSlug: dto.tenantSlug };
    }
    async residentLogout(jti) {
        await this.authRepo.revokeResidentSession(jti);
        return { success: true };
    }
    async residentProfile(tenantSlug, residentId) {
        const resident = await this.authRepo.findResidentProfile(tenantSlug, residentId);
        if (!resident || !resident.is_active)
            throw new common_1.UnauthorizedException('La sesión Resident ya no es válida.');
        return { resident, tenantSlug };
    }
    async activateResident(dto) {
        this.assertResidentRateLimit('activate', dto.token);
        this.validateResidentPassword(dto.password);
        const result = await this.authRepo.activateResident(dto.token, dto.password);
        if (!result)
            throw new common_1.UnauthorizedException('La invitación es inválida, expiró o ya fue utilizada.');
        await this.authRepo.recordResidentAudit(result.tenantSlug, 'ACTIVATE', result.resident.id);
        return { success: true, message: 'Cuenta Resident activada. Ya puedes iniciar sesión.', data: result.resident };
    }
    async changeResidentPassword(dto) {
        this.validateResidentPassword(dto.newPassword);
        const identifier = (dto.identifier || dto.email || '').trim();
        const resident = await this.authRepo.changeResidentPassword(dto.tenantSlug, identifier, dto.currentPassword, dto.newPassword);
        if (!resident)
            throw new common_1.UnauthorizedException('La contraseña temporal o las credenciales no son válidas.');
        await this.authRepo.recordResidentAudit(dto.tenantSlug, 'PASSWORD_CHANGE', resident.id);
        return { success: true, message: 'Contraseña actualizada correctamente.', data: resident };
    }
    async requestResidentPasswordRecovery(dto) {
        this.assertResidentRateLimit('recovery', dto.identifier);
        const result = await this.authRepo.createResidentPasswordReset(dto.tenantSlug, dto.identifier);
        if (result)
            await this.authRepo.recordResidentAudit(dto.tenantSlug, 'PASSWORD_RECOVERY_REQUEST', result.id);
        const data = { expiresAt: result?.expires_at };
        if (result) {
            const recipient = result.email || result.phone;
            const channel = result.email ? 'EMAIL' : 'WHATSAPP';
            if (recipient) {
                try {
                    await this.notificationDelivery.sendRecovery(dto.tenantSlug, channel, recipient, {
                        residentName: `${result.first_name} ${result.last_name}`,
                        communityName: dto.tenantSlug,
                        activationUrl: `${process.env.RESIDENT_APP_URL || 'http://localhost:3003'}/reset-resident?token=${encodeURIComponent(result.token)}&tenant=${encodeURIComponent(dto.tenantSlug)}`,
                        expiresAt: new Date(result.expires_at).toLocaleString('es-MX'),
                    });
                }
                catch (error) {
                    this.logger.warn(`No se pudo entregar recuperación Resident por ${channel}: ${error instanceof Error ? error.message : 'error desconocido'}`);
                }
            }
        }
        if (process.env.NODE_ENV !== 'production' && result?.token)
            data.resetToken = result.token;
        return { success: true, message: 'Si las credenciales existen, recibirás instrucciones para recuperar el acceso.', data };
    }
    async resetResidentPassword(dto) {
        this.assertResidentRateLimit('reset', dto.token);
        this.validateResidentPassword(dto.newPassword);
        const resident = await this.authRepo.resetResidentPassword(dto.token, dto.newPassword);
        if (!resident)
            throw new common_1.UnauthorizedException('El enlace de recuperación es inválido, expiró o ya fue utilizado.');
        await this.authRepo.recordResidentAudit(resident.tenantSlug, 'PASSWORD_RESET', resident.id);
        return { success: true, message: 'Contraseña recuperada correctamente.', data: resident };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        jwt_1.JwtService,
        auth_repository_1.AuthRepository,
        notification_delivery_service_1.NotificationDeliveryService,
        resident_rate_limiter_1.InMemoryResidentRateLimiter])
], AuthService);
//# sourceMappingURL=auth.service.js.map