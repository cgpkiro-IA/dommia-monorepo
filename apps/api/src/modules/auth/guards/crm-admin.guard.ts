import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AdminSessionClaims, AdminSessionGuard } from './admin-session.guard';

const CRM_ROLES = new Set(['SUPER_ADMIN', 'COMMERCIAL_EXEC', 'SUPPORT']);

@Injectable()
export class CrmAdminGuard implements CanActivate {
  constructor(private readonly adminSession: AdminSessionGuard) {}

  canActivate(context: ExecutionContext) {
    this.adminSession.canActivate(context);
    const request = context.switchToHttp().getRequest<{ user: AdminSessionClaims }>();
    if (!CRM_ROLES.has(request.user.role)) {
      throw new ForbiddenException('No tienes permisos para acceder al CRM.');
    }
    return true;
  }
}