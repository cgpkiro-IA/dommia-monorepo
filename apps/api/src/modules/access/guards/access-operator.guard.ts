import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

export interface AccessOperatorClaims {
  sub: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'OPERATOR' | 'GUARD';
  tenantSlug: string | null;
  exp: number;
}

@Injectable()
export class AccessOperatorGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      params: { slug?: string };
      user?: AccessOperatorClaims;
    }>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('Autenticación de caseta requerida.');

    const [encodedClaims, signature] = authorization.slice(7).split('.');
    if (!encodedClaims || !signature) throw new UnauthorizedException('Token inválido.');

    const secret = process.env.AUTH_TOKEN_SECRET || 'dommia-local-auth-secret-change-me';
    const expected = Buffer.from(createHmac('sha256', secret).update(encodedClaims).digest('base64url'));
    const actual = Buffer.from(signature);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new UnauthorizedException('Token inválido.');
    }

    let claims: AccessOperatorClaims;
    try {
      claims = JSON.parse(Buffer.from(encodedClaims, 'base64url').toString('utf8')) as AccessOperatorClaims;
    } catch {
      throw new UnauthorizedException('Token inválido.');
    }

    if (!claims.sub || !claims.exp || claims.exp < Date.now()) throw new UnauthorizedException('Sesión expirada.');
    if (!['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR', 'GUARD'].includes(claims.role)) {
      throw new ForbiddenException('No tienes permisos para validar accesos.');
    }
    if (claims.role !== 'SUPER_ADMIN' && claims.tenantSlug !== request.params.slug) {
      throw new ForbiddenException('El tenant de la sesión no coincide con la operación.');
    }

    request.user = claims;
    return true;
  }
}