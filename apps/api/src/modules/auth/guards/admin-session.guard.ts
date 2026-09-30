import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

export interface AdminSessionClaims {
  sub: string;
  email?: string;
  role: string;
  tenantId?: string | null;
  tenantSlug?: string | null;
  exp: number;
  purpose?: string;
}

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR', 'COMMERCIAL_EXEC', 'SUPPORT']);

@Injectable()
export class AdminSessionGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: AdminSessionClaims;
    }>();
    if (request.user) {
      const claims = request.user;
      if (!claims.sub || !claims.exp || claims.exp <= Date.now() || claims.purpose === 'mfa_login') {
        throw new UnauthorizedException('La sesión no es válida o expiró.');
      }
      if (!ADMIN_ROLES.has(claims.role)) throw new ForbiddenException('No tienes permisos de administración.');
      return true;
    }

    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('Autenticación requerida.');

    const [encodedClaims, encodedSignature] = authorization.slice(7).split('.');
    if (!encodedClaims || !encodedSignature) throw new UnauthorizedException('Token inválido.');
    const expected = Buffer.from(createHmac('sha256', this.config.getOrThrow<string>('AUTH_TOKEN_SECRET'))
      .update(encodedClaims).digest('base64url'));
    const actual = Buffer.from(encodedSignature);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new UnauthorizedException('Token inválido.');
    }

    let claims: AdminSessionClaims & { purpose?: string };
    try {
      claims = JSON.parse(Buffer.from(encodedClaims, 'base64url').toString('utf8')) as AdminSessionClaims & { purpose?: string };
    } catch {
      throw new UnauthorizedException('Token inválido.');
    }
    if (!claims.sub || !claims.exp || claims.exp < Date.now() || claims.purpose === 'mfa_login') {
      throw new UnauthorizedException('La sesión no es válida o expiró.');
    }
    if (!ADMIN_ROLES.has(claims.role)) throw new ForbiddenException('No tienes permisos de administración.');

    request.user = claims;
    return true;
  }
}