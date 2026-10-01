import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { createHmac, timingSafeEqual } from 'crypto';
import { AuthRepository } from '../repositories/auth.repository';
import { IS_PUBLIC_KEY } from '../decorators/auth-metadata.decorator';

interface LegacySessionClaims {
  sub: string;
  role: string;
  tenantSlug?: string | null;
  jti?: string;
  exp: number;
  purpose?: string;
}

@Injectable()
export class ApiAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
    private readonly authRepository: AuthRepository,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: Record<string, unknown>;
    }>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('Autenticación requerida.');

    const token = authorization.slice(7);
    if (token.split('.').length === 2) {
      request.user = await this.validateLegacyToken(token);
      return true;
    }

    return super.canActivate(context) as Promise<boolean>;
  }

  private async validateLegacyToken(token: string) {
    const [encodedClaims, encodedSignature] = token.split('.');
    if (!encodedClaims || !encodedSignature) throw new UnauthorizedException('Token inválido.');

    const expected = Buffer.from(createHmac('sha256', this.config.getOrThrow<string>('AUTH_TOKEN_SECRET'))
      .update(encodedClaims).digest('base64url'));
    const actual = Buffer.from(encodedSignature);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new UnauthorizedException('Token inválido.');
    }

    let claims: LegacySessionClaims;
    try {
      claims = JSON.parse(Buffer.from(encodedClaims, 'base64url').toString('utf8')) as LegacySessionClaims;
    } catch {
      throw new UnauthorizedException('Token inválido.');
    }

    const validRoles = new Set(['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR', 'COMMERCIAL_EXEC', 'SUPPORT', 'GUARD', 'RESIDENT']);
    if (!claims.sub || !Number.isSafeInteger(claims.exp) || claims.exp <= Date.now()
      || claims.purpose === 'mfa_login' || !validRoles.has(claims.role)) {
      throw new UnauthorizedException('La sesión no es válida o expiró.');
    }

    if (claims.role === 'RESIDENT') {
      if (!claims.jti || !claims.tenantSlug
        || !await this.authRepository.isResidentSessionActive(claims.jti, claims.sub, claims.tenantSlug)) {
        throw new UnauthorizedException('Sesión Resident revocada o expirada.');
      }
    }

    return claims as unknown as Record<string, unknown>;
  }
}