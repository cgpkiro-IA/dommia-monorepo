import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository';
import { LoginDto } from '../dto/login.dto';

export interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  tier: string;
  maxProperties: number;
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

  constructor(private readonly authRepo: AuthRepository) {}

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

    const token = Buffer.from(
      JSON.stringify({
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: activeTenant?.id || null,
        tenantSlug: activeTenant?.slug || null,
        exp: Date.now() + 24 * 60 * 60 * 1000,
      }),
    ).toString('base64');

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
}
