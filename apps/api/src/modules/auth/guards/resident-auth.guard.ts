import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { AuthRepository } from '../repositories/auth.repository';

export interface ResidentSessionClaims {
  sub: string;
  role: 'RESIDENT';
  tenantSlug: string;
  propertyId: string;
  jti: string;
  exp: number;
  sid?: string;
  aud?: string;
  iss?: string;
  clientType?: 'ANDROID' | 'IOS';
}

@Injectable()
export class ResidentAuthGuard implements CanActivate {
  constructor(private readonly authRepository: AuthRepository) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; user?: ResidentSessionClaims }>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('Autenticación Resident requerida.');
    const token = authorization.slice(7);
    const parts = token.split('.');
    if (parts.length !== 2 && parts.length !== 3) throw new UnauthorizedException('Token Resident inválido.');
    const isMobileJwt = parts.length === 3;
    const [encodedHeader, encodedClaims, signature] = isMobileJwt
      ? [parts[0], parts[1], parts[2]]
      : [undefined, parts[0], parts[1]];
    if (!encodedClaims || !signature) throw new UnauthorizedException('Token Resident inválido.');
    const secret = isMobileJwt
      ? process.env.RESIDENT_APP_TOKEN_SECRET || (process.env.NODE_ENV === 'production' ? '' : process.env.AUTH_TOKEN_SECRET || 'dommia-local-auth-secret-change-me')
      : process.env.AUTH_TOKEN_SECRET || 'dommia-local-auth-secret-change-me';
    if (!secret) throw new UnauthorizedException('Token Resident inválido.');
    let signingInput = encodedClaims;
    if (isMobileJwt) {
      try {
        const header = JSON.parse(Buffer.from(encodedHeader!, 'base64url').toString('utf8')) as Record<string, unknown>;
        if (header.alg !== 'HS256' || header.typ !== 'JWT' || header.kid !== 'resident-hs256-v1') {
          throw new UnauthorizedException('Token Resident inválido.');
        }
        signingInput = `${encodedHeader}.${encodedClaims}`;
      } catch (error) {
        if (error instanceof UnauthorizedException) throw error;
        throw new UnauthorizedException('Token Resident inválido.');
      }
    }
    const expected = Buffer.from(createHmac('sha256', secret).update(signingInput).digest('base64url'));
    const actual = Buffer.from(signature);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new UnauthorizedException('Token Resident inválido.');
    try {
      const claims = JSON.parse(Buffer.from(encodedClaims, 'base64url').toString('utf8')) as ResidentSessionClaims;
      const expiresAtMs = isMobileJwt ? claims.exp * 1000 : claims.exp;
      if (claims.role !== 'RESIDENT' || !claims.sub || !claims.jti || !claims.tenantSlug || !claims.exp || expiresAtMs <= Date.now()) throw new UnauthorizedException('Sesión Resident inválida o expirada.');
      if (isMobileJwt && (
        claims.iss !== 'dommia-api'
        || claims.aud !== 'dommia-resident-api'
        || !claims.sid
        || !claims.propertyId
        || (claims.clientType !== 'ANDROID' && claims.clientType !== 'IOS')
      )) throw new UnauthorizedException('Token Resident inválido.');
      const active = await this.authRepository.isResidentSessionActive(claims.jti, claims.sub, claims.tenantSlug);
      if (!active) throw new UnauthorizedException('Sesión Resident revocada o expirada.');
      request.user = claims;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Token Resident inválido.');
    }
  }
}

@Injectable()
export class ResidentAppAuthGuard extends ResidentAuthGuard {
  constructor(authRepository: AuthRepository) {
    super(authRepository);
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ user?: ResidentSessionClaims }>();
    await super.canActivate(context);
    const claims = request.user;
    if (
      claims?.iss !== 'dommia-api'
      || claims.aud !== 'dommia-resident-api'
      || (claims.clientType !== 'ANDROID' && claims.clientType !== 'IOS')
    ) {
      throw new UnauthorizedException('Se requiere una sesión móvil Resident.');
    }
    return true;
  }
}