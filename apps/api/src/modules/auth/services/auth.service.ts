import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import * as OTPAuth from 'otpauth';
import * as QRCode from 'qrcode';
import { AuthRepository } from '../repositories/auth.repository';
import { LoginDto } from '../dto/login.dto';
import { ResidentActivateDto, ResidentChangePasswordDto, ResidentLoginDto, ResidentPasswordRecoveryRequestDto, ResidentPasswordResetDto } from '../dto/resident-auth.dto';
import { NotificationDeliveryService } from '../../notifications/services/notification-delivery.service';

export interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  tier: string;
  maxProperties: number;
  modules: string[] | Record<string, boolean>;
  hasCustomDomain: boolean;
  customDomain: string | null;
  accessUrl: string;
  role: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  tenants: TenantInfo[];
  activeTenant: TenantInfo | null;
  token: string;
}

export interface MfaLoginChallenge {
  mfaRequired: true;
  challengeToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly residentRateLimits = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly authRepo: AuthRepository, private readonly notificationDelivery: NotificationDeliveryService) {}

  private signClaims(claims: Record<string, unknown>) {
    const encodedClaims = Buffer.from(JSON.stringify(claims)).toString('base64url');
    const signature = createHmac('sha256', process.env.AUTH_TOKEN_SECRET || 'dommia-local-auth-secret-change-me')
      .update(encodedClaims)
      .digest('base64url');
    return `${encodedClaims}.${signature}`;
  }

  private verifySignedClaims(token: string) {
    const [encodedClaims, encodedSignature] = token.split('.');
    if (!encodedClaims || !encodedSignature) throw new UnauthorizedException('Desafío MFA inválido o expirado.');
    const expected = Buffer.from(createHmac('sha256', process.env.AUTH_TOKEN_SECRET || 'dommia-local-auth-secret-change-me')
      .update(encodedClaims).digest('base64url'));
    const actual = Buffer.from(encodedSignature);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new UnauthorizedException('Desafío MFA inválido o expirado.');
    }
    try {
      const claims = JSON.parse(Buffer.from(encodedClaims, 'base64url').toString('utf8')) as Record<string, unknown>;
      if (typeof claims.exp !== 'number' || claims.exp <= Date.now()) throw new Error('expired');
      return claims;
    } catch {
      throw new UnauthorizedException('Desafío MFA inválido o expirado.');
    }
  }

  private encryptionKey() {
    const configuredKey = process.env.MFA_ENCRYPTION_KEY;
    if (process.env.NODE_ENV === 'production' && !configuredKey) {
      throw new Error('MFA_ENCRYPTION_KEY es obligatorio en producción.');
    }
    if (configuredKey && !/^[0-9a-f]{64}$/i.test(configuredKey)) {
      throw new Error('MFA_ENCRYPTION_KEY debe contener 64 caracteres hexadecimales.');
    }
    return configuredKey
      ? Buffer.from(configuredKey, 'hex')
      : createHash('sha256').update(process.env.AUTH_TOKEN_SECRET || 'dommia-local-auth-secret-change-me').digest();
  }

  private encryptSecret(secret: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64url')).join('.');
  }

  private decryptSecret(encryptedSecret: string) {
    const [encodedIv, encodedTag, encodedCiphertext] = encryptedSecret.split('.');
    if (!encodedIv || !encodedTag || !encodedCiphertext) throw new Error('El secreto MFA almacenado no es válido.');
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey(), Buffer.from(encodedIv, 'base64url'));
    decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(encodedCiphertext, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }

  private validateTotp(secretBase32: string, code: string) {
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

  private validateResidentPassword(password: string) {
    const isStrong = password.length >= 10
      && /[A-Z]/.test(password)
      && /[a-z]/.test(password)
      && /\d/.test(password)
      && /[^A-Za-z0-9]/.test(password);
    if (!isStrong) {
      throw new BadRequestException('La contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula, un número y un símbolo.');
    }
  }

  private assertResidentRateLimit(action: string, identifier: string) {
    const key = `${action}:${identifier.trim().toLowerCase()}`;
    const now = Date.now();
    const current = this.residentRateLimits.get(key);
    if (!current || current.resetAt <= now) {
      this.residentRateLimits.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
      return;
    }
    if (current.count >= 8) throw new HttpException('Demasiados intentos. Intenta nuevamente más tarde.', HttpStatus.TOO_MANY_REQUESTS);
    current.count += 1;
  }

  async login(dto: LoginDto): Promise<AuthSession | MfaLoginChallenge> {
    const email = dto.email.trim().toLowerCase();

    // Verify password through repository
    const user = await this.authRepo.findUserByEmailAndPassword(email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas. Verifica tu correo y contraseña.');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Tu cuenta se encuentra inactiva. Contacta al administrador.');
    }

    if (user.mfa_enabled) {
      const expiresAt = Date.now() + 5 * 60 * 1000;
      const challengeId = await this.authRepo.createMfaChallenge(user.id, new Date(expiresAt));
      if (!challengeId) throw new HttpException('Demasiados intentos de acceso. Intenta nuevamente en 15 minutos.', HttpStatus.TOO_MANY_REQUESTS);
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

  private async createAuthSession(user: any, requestedTenantSlug?: string): Promise<AuthSession> {

    let tenantList: TenantInfo[] = [];

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
    } else {
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

    // Resolve active workspace
    let activeTenant: TenantInfo | null = null;
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

    this.logger.log(
      `Login exitoso: ${user.email} (Comunidades vinculadas: ${tenantList.length}, Activo: ${activeTenant?.slug || 'PENDIENTE_SELECCION'})`,
    );

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

  async verifyMfaLogin(challengeToken: string, code: string): Promise<AuthSession> {
    const claims = this.verifySignedClaims(challengeToken);
    if (claims.purpose !== 'mfa_login' || claims.role !== 'MFA_PENDING'
      || typeof claims.sub !== 'string' || typeof claims.challengeId !== 'string') {
      throw new UnauthorizedException('Desafío MFA inválido o expirado.');
    }

    const challenge = await this.authRepo.findActiveMfaChallenge(claims.challengeId, claims.sub);
    const user = await this.authRepo.findUserForMfa(claims.sub);
    if (!challenge || !user?.is_active || !user.mfa_enabled || !user.mfa_secret_encrypted) {
      throw new UnauthorizedException('Desafío MFA inválido o expirado.');
    }

    const step = this.validateTotp(this.decryptSecret(user.mfa_secret_encrypted), code);
    if (step === null) {
      await this.authRepo.recordFailedMfaChallenge(claims.challengeId);
      throw new UnauthorizedException('El código de autenticación no es válido.');
    }
    if (!await this.authRepo.consumeMfaChallenge(claims.challengeId, claims.sub)
      || !await this.authRepo.consumeMfaStep(claims.sub, step)) {
      throw new UnauthorizedException('El código ya fue utilizado. Solicita un nuevo inicio de sesión.');
    }

    return this.createAuthSession(user, typeof claims.tenantSlug === 'string' ? claims.tenantSlug : undefined);
  }

  async getMfaStatus(userId: string) {
    const settings = await this.authRepo.getMfaSettings(userId);
    if (!settings) throw new UnauthorizedException('La cuenta no está activa.');
    return { enabled: Boolean(settings.mfa_enabled), setupPending: Boolean(settings.mfa_pending_secret_encrypted) };
  }

  async startMfaSetup(userId: string, password: string) {
    if (!await this.authRepo.verifyUserPassword(userId, password)) {
      throw new UnauthorizedException('La contraseña actual no es válida.');
    }
    const user = await this.authRepo.findUserForMfa(userId);
    if (!user?.is_active) throw new UnauthorizedException('La cuenta no está activa.');
    if (user.mfa_enabled) throw new BadRequestException('La autenticación de dos pasos ya está activada.');

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

  async enableMfa(userId: string, code: string) {
    const settings = await this.authRepo.getMfaSettings(userId);
    if (!settings?.mfa_pending_secret_encrypted || !settings.mfa_pending_created_at
      || Date.now() - new Date(settings.mfa_pending_created_at).getTime() > 10 * 60 * 1000) {
      throw new BadRequestException('La configuración expiró. Inicia de nuevo el registro del autenticador.');
    }
    const step = this.validateTotp(this.decryptSecret(settings.mfa_pending_secret_encrypted), code);
    if (step === null || !await this.authRepo.enableMfa(userId, step)) {
      throw new UnauthorizedException('El código no es válido o la configuración expiró.');
    }
    return { enabled: true };
  }

  async disableMfa(userId: string, password: string, code: string) {
    if (!await this.authRepo.verifyUserPassword(userId, password)) {
      throw new UnauthorizedException('La contraseña actual no es válida.');
    }
    const settings = await this.authRepo.getMfaSettings(userId);
    if (!settings?.mfa_enabled || !settings.mfa_secret_encrypted) {
      throw new BadRequestException('La autenticación de dos pasos no está activada.');
    }
    const step = this.validateTotp(this.decryptSecret(settings.mfa_secret_encrypted), code);
    if (step === null || !await this.authRepo.disableMfa(userId, step)) {
      throw new UnauthorizedException('El código de autenticación no es válido o ya fue utilizado.');
    }
    return { enabled: false };
  }

  async selectTenant(userId: string, tenantSlug: string) {
    const user = await this.authRepo.findUserForMfa(userId);
    if (!user?.is_active) throw new UnauthorizedException('La sesión ya no es válida.');
    const session = await this.createAuthSession(user, tenantSlug);
    if (!session.activeTenant) throw new ForbiddenException('No tienes acceso al fraccionamiento seleccionado.');
    return session;
  }

  async residentLogin(dto: ResidentLoginDto) {
    const identifier = (dto.identifier || dto.email || '').trim();
    this.assertResidentRateLimit('login', identifier);
    const resident = await this.authRepo.findResidentByCredentials(dto.tenantSlug, identifier, dto.password);
    if (!resident || !resident.is_active) throw new UnauthorizedException('Credenciales Resident inválidas.');
    await this.authRepo.recordResidentAudit(dto.tenantSlug, 'LOGIN', resident.id, { identifierType: dto.identifier?.includes('@') || dto.email?.includes('@') ? 'EMAIL' : 'PHONE' });
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const jti = randomUUID();
    await this.authRepo.createResidentSession(jti, resident.id, dto.tenantSlug, new Date(expiresAt));
    const claims = Buffer.from(JSON.stringify({ sub: resident.id, email: resident.email, role: 'RESIDENT', tenantSlug: dto.tenantSlug, propertyId: resident.property_id, mustChangePassword: resident.must_change_password, jti, exp: expiresAt })).toString('base64url');
    const signature = createHmac('sha256', process.env.AUTH_TOKEN_SECRET || 'dommia-local-auth-secret-change-me').update(claims).digest('base64url');
    return { token: `${claims}.${signature}`, mustChangePassword: resident.must_change_password, resident, tenantSlug: dto.tenantSlug };
  }

  async residentLogout(jti: string) {
    await this.authRepo.revokeResidentSession(jti);
    return { success: true };
  }

  async residentProfile(tenantSlug: string, residentId: string) {
    const resident = await this.authRepo.findResidentProfile(tenantSlug, residentId);
    if (!resident || !resident.is_active) throw new UnauthorizedException('La sesión Resident ya no es válida.');
    return { resident, tenantSlug };
  }

  async activateResident(dto: ResidentActivateDto) {
    this.assertResidentRateLimit('activate', dto.token);
    this.validateResidentPassword(dto.password);
    const result = await this.authRepo.activateResident(dto.token, dto.password);
    if (!result) throw new UnauthorizedException('La invitación es inválida, expiró o ya fue utilizada.');
    await this.authRepo.recordResidentAudit(result.tenantSlug, 'ACTIVATE', result.resident.id);
    return { success: true, message: 'Cuenta Resident activada. Ya puedes iniciar sesión.', data: result.resident };
  }

  async changeResidentPassword(dto: ResidentChangePasswordDto) {
    this.validateResidentPassword(dto.newPassword);
    const identifier = (dto.identifier || dto.email || '').trim();
    const resident = await this.authRepo.changeResidentPassword(dto.tenantSlug, identifier, dto.currentPassword, dto.newPassword);
    if (!resident) throw new UnauthorizedException('La contraseña temporal o las credenciales no son válidas.');
    await this.authRepo.recordResidentAudit(dto.tenantSlug, 'PASSWORD_CHANGE', resident.id);
    return { success: true, message: 'Contraseña actualizada correctamente.', data: resident };
  }

  async requestResidentPasswordRecovery(dto: ResidentPasswordRecoveryRequestDto) {
    this.assertResidentRateLimit('recovery', dto.identifier);
    const result = await this.authRepo.createResidentPasswordReset(dto.tenantSlug, dto.identifier);
    if (result) await this.authRepo.recordResidentAudit(dto.tenantSlug, 'PASSWORD_RECOVERY_REQUEST', result.id);
    const data: { expiresAt?: string; resetToken?: string } = { expiresAt: result?.expires_at };
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
        } catch (error) {
          this.logger.warn(`No se pudo entregar recuperación Resident por ${channel}: ${error instanceof Error ? error.message : 'error desconocido'}`);
        }
      }
    }
    if (process.env.NODE_ENV !== 'production' && result?.token) data.resetToken = result.token;
    return { success: true, message: 'Si las credenciales existen, recibirás instrucciones para recuperar el acceso.', data };
  }

  async resetResidentPassword(dto: ResidentPasswordResetDto) {
    this.assertResidentRateLimit('reset', dto.token);
    this.validateResidentPassword(dto.newPassword);
    const resident = await this.authRepo.resetResidentPassword(dto.token, dto.newPassword);
    if (!resident) throw new UnauthorizedException('El enlace de recuperación es inválido, expiró o ya fue utilizado.');
    await this.authRepo.recordResidentAudit(resident.tenantSlug, 'PASSWORD_RESET', resident.id);
    return { success: true, message: 'Contraseña recuperada correctamente.', data: resident };
  }
}
