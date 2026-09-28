import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createHmac, randomUUID } from 'crypto';
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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly residentRateLimits = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly authRepo: AuthRepository, private readonly notificationDelivery: NotificationDeliveryService) {}

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

  async login(dto: LoginDto): Promise<AuthSession> {
    const email = dto.email.trim().toLowerCase();

    // Verify password through repository
    const user = await this.authRepo.findUserByEmailAndPassword(email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas. Verifica tu correo y contraseña.');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Tu cuenta se encuentra inactiva. Contacta al administrador.');
    }

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
    if (dto.tenantSlug) {
      const match = tenantList.find((t) => t.slug.toLowerCase() === dto.tenantSlug?.toLowerCase());
      if (match) {
        activeTenant = match;
      }
    }

    if (!activeTenant && tenantList.length === 1) {
      activeTenant = tenantList[0];
    }

    const encodedClaims = Buffer.from(JSON.stringify({
        sub: user.id,
        email: user.email,
        role: activeTenant?.role || user.role,
        tenantId: activeTenant?.id || null,
        tenantSlug: activeTenant?.slug || null,
        exp: Date.now() + 24 * 60 * 60 * 1000,
      })).toString('base64url');
    const signature = createHmac('sha256', process.env.AUTH_TOKEN_SECRET || 'dommia-local-auth-secret-change-me')
      .update(encodedClaims)
      .digest('base64url');
    const token = `${encodedClaims}.${signature}`;

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
