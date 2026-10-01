import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';

interface FinanceRequest {
  params: { slug?: string };
  user?: { sub?: string; role?: string; tenantSlug?: string | null };
}

@Injectable()
export class FinanceCampaignGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<FinanceRequest>();
    const user = request.user;
    if (!user?.sub || !user.role) throw new UnauthorizedException('Autenticación requerida.');

    if (user.role === 'SUPER_ADMIN') return true;
    if (user.tenantSlug !== request.params.slug) {
      throw new ForbiddenException('El tenant de la sesión no coincide con la operación.');
    }
    if (!['RESIDENT', 'TENANT_ADMIN', 'OPERATOR'].includes(user.role)) {
      throw new ForbiddenException('No tienes permisos para consultar campañas financieras.');
    }

    return true;
  }
}