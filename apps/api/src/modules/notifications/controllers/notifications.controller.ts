import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { FinanceAdminGuard } from '../../auth/guards/finance-admin.guard';
import { NotificationConfigDto } from '../dto/notification-config.dto';
import { Roles } from '../../auth/decorators/auth-metadata.decorator';
import { NotificationsService } from '../services/notifications.service';

@Controller('tenants/:slug/notifications')
@UseGuards(FinanceAdminGuard)
@Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('config')
  async getConfig(@Param('slug') slug: string) {
    return { success: true, data: await this.notificationsService.getConfig(slug) };
  }

  @Patch('config')
  async saveConfig(@Param('slug') slug: string, @Body() dto: NotificationConfigDto) {
    return { success: true, message: 'Configuración de notificaciones guardada.', data: await this.notificationsService.saveConfig(slug, dto) };
  }

  @Delete('config/:channel')
  async removeConfig(@Param('slug') slug: string, @Param('channel') channel: 'SMTP' | 'WHATSAPP_BUSINESS') {
    return { success: true, message: 'Configuración de notificaciones eliminada.', data: await this.notificationsService.removeConfig(slug, channel) };
  }
}