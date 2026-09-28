import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

interface SessionClaims {
  sub: string;
  role: string;
  tenantSlug: string | null;
  exp: number;
}

@Injectable()
export class FinanceAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; params: { slug?: string } }>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('Autenticación requerida.');

    const token = authorization.slice(7);
    const [encodedClaims, encodedSignature] = token.split('.');
    if (!encodedClaims || !encodedSignature) throw new UnauthorizedException('Token inválido.');

    const secret = process.env.AUTH_TOKEN_SECRET || 'dommia-local-auth-secret-change-me';
    const expectedSignature = createHmac('sha256', secret).update(encodedClaims).digest('base64url');
    const actual = Buffer.from(encodedSignature);
    const expected = Buffer.from(expectedSignature);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new UnauthorizedException('Token inválido.');
    }

    let claims: SessionClaims;
    try {
      claims = JSON.parse(Buffer.from(encodedClaims, 'base64url').toString('utf8')) as SessionClaims;
    } catch {
      throw new UnauthorizedException('Token inválido.');
    }
    if (!claims.exp || claims.exp < Date.now()) throw new UnauthorizedException('Sesión expirada.');
    if (!['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR'].includes(claims.role)) {
      throw new ForbiddenException('No tienes permisos para operar finanzas.');
    }
    if (claims.role !== 'SUPER_ADMIN' && claims.tenantSlug !== request.params.slug) {
      throw new ForbiddenException('El tenant de la sesión no coincide con la operación.');
    }

    return true;
  }
}