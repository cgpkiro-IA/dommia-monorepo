import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthRepository } from '../repositories/auth.repository';

const RESIDENT_APP_ISSUER = 'dommia-api';
const RESIDENT_APP_AUDIENCE = 'dommia-resident-api';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService, private readonly authRepository: AuthRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: (_request, token, done) => {
        try {
          const encodedPayload = token.split('.')[1];
          if (!encodedPayload) throw new Error('Token JWT inválido.');
          const claims = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as Record<string, unknown>;
          const isResidentApp = claims.iss === RESIDENT_APP_ISSUER || claims.aud === RESIDENT_APP_AUDIENCE;
          const secretName = isResidentApp ? 'RESIDENT_APP_TOKEN_SECRET' : 'AUTH_TOKEN_SECRET';
          done(null, config.getOrThrow<string>(secretName));
        } catch (error) {
          done(error instanceof Error ? error : new Error('No se pudo resolver la llave JWT.'));
        }
      },
      algorithms: ['HS256'],
    });
  }

  async validate(claims: Record<string, unknown>) {
    const expiresAt = claims.exp;
    const role = claims.role;
    const subject = claims.sub;
    const isResidentApp = claims.iss === RESIDENT_APP_ISSUER && claims.aud === RESIDENT_APP_AUDIENCE;

    if (typeof subject !== 'string' || typeof role !== 'string'
      || typeof expiresAt !== 'number' || !Number.isSafeInteger(expiresAt)
      || expiresAt * 1000 <= Date.now() || claims.purpose === 'mfa_login') {
      throw new UnauthorizedException('La sesión no es válida o expiró.');
    }

    if (role === 'RESIDENT') {
      const tenantSlug = claims.tenantSlug;
      const sessionId = claims.jti;
      if (typeof tenantSlug !== 'string' || typeof sessionId !== 'string') {
        throw new UnauthorizedException('Token Resident inválido.');
      }
      if (isResidentApp && (
        claims.sid === undefined
        || typeof claims.propertyId !== 'string'
        || (claims.clientType !== 'ANDROID' && claims.clientType !== 'IOS')
      )) {
        throw new UnauthorizedException('Token Resident móvil inválido.');
      }
      if (!await this.authRepository.isResidentSessionActive(sessionId, subject, tenantSlug)) {
        throw new UnauthorizedException('Sesión Resident revocada o expirada.');
      }
    } else if (isResidentApp) {
      throw new UnauthorizedException('Token Resident móvil inválido.');
    }

    return { ...claims, exp: expiresAt * 1000 };
  }
}