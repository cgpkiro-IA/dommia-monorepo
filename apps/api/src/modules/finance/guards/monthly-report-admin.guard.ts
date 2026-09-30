import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';

interface TenantAdminClaims {
  sub: string;
  role: string;
  tenantSlug: string | null;
  exp: number;
}

@Injectable()
export class MonthlyReportAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      params: { slug?: string };
      user?: TenantAdminClaims;
    }>();
    const user = request.user;
    if (!user?.sub || !user.exp || user.exp <= Date.now()) {
      throw new UnauthorizedException('Autenticación administrativa requerida.');
    }
    if (user.role !== 'TENANT_ADMIN') {
      throw new ForbiddenException('Solo el administrador del fraccionamiento puede gestionar rendiciones mensuales.');
    }
    if (!request.params.slug || user.tenantSlug !== request.params.slug) {
      throw new ForbiddenException('El tenant de la sesión no coincide con la rendición solicitada.');
    }
    return true;
  }
}
