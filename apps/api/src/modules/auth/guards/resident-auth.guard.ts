import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { DatabaseService } from '../../../database/database.service';

export interface ResidentSessionClaims {
  sub: string;
  role: 'RESIDENT';
  tenantSlug: string;
  propertyId: string;
  jti: string;
  exp: number;
}

@Injectable()
export class ResidentAuthGuard implements CanActivate {
  constructor(private readonly db: DatabaseService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; user?: ResidentSessionClaims }>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('Autenticación Resident requerida.');
    const [encodedClaims, signature] = authorization.slice(7).split('.');
    if (!encodedClaims || !signature) throw new UnauthorizedException('Token Resident inválido.');
    const secret = process.env.AUTH_TOKEN_SECRET || 'dommia-local-auth-secret-change-me';
    const expected = Buffer.from(createHmac('sha256', secret).update(encodedClaims).digest('base64url'));
    const actual = Buffer.from(signature);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new UnauthorizedException('Token Resident inválido.');
    try {
      const claims = JSON.parse(Buffer.from(encodedClaims, 'base64url').toString('utf8')) as ResidentSessionClaims;
      if (claims.role !== 'RESIDENT' || !claims.sub || !claims.jti || !claims.tenantSlug || !claims.exp || claims.exp < Date.now()) throw new UnauthorizedException('Sesión Resident inválida o expirada.');
      await this.db.query(`CREATE TABLE IF NOT EXISTS public.resident_sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), jti UUID UNIQUE NOT NULL, resident_id UUID NOT NULL, tenant_slug VARCHAR(150) NOT NULL, expires_at TIMESTAMPTZ NOT NULL, revoked_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
      const session = await this.db.query('SELECT 1 FROM public.resident_sessions WHERE jti = $1 AND resident_id = $2 AND tenant_slug = $3 AND revoked_at IS NULL AND expires_at > NOW()', [claims.jti, claims.sub, claims.tenantSlug]);
      if (!session.rows[0]) throw new UnauthorizedException('Sesión Resident revocada o expirada.');
      request.user = claims;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Token Resident inválido.');
    }
  }
}