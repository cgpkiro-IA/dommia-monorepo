import { Controller, Get, Header, Req, UseFilters, UseGuards } from '@nestjs/common';
import { ResidentAppExceptionFilter } from '../../auth/filters/resident-app-exception.filter';
import { ResidentAuthGuard, ResidentSessionClaims } from '../../auth/guards/resident-auth.guard';
import { NoticesService } from '../services/notices.service';
import { Roles } from '../../auth/decorators/auth-metadata.decorator';

@Controller('auth/app/resident')
@UseFilters(ResidentAppExceptionFilter)
@UseGuards(ResidentAuthGuard)
@Roles('RESIDENT')
export class ResidentAppNoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Get('notices')
  @Header('Cache-Control', 'no-store, max-age=0')
  async getNotices(@Req() request: { user: ResidentSessionClaims }) {
    const notices = await this.noticesService.getTenantNotices(request.user.tenantSlug, true, 'RESIDENTS');
    return { success: true, data: notices, count: notices.length };
  }
}
