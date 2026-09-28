import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantsRepository } from '../../tenants/repositories/tenants.repository';
import { NotificationConfigDto } from '../dto/notification-config.dto';
import { NotificationsRepository } from '../repositories/notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly tenantsRepo: TenantsRepository,
    private readonly notificationsRepo: NotificationsRepository,
  ) {}

  private hasPremiumNotifications(modules: string[] | Record<string, boolean> | null | undefined) {
    if (Array.isArray(modules)) return modules.includes('NOTIFICATIONS_PREMIUM');
    return Boolean(modules?.NOTIFICATIONS_PREMIUM);
  }

  private async getPremiumTenant(slug: string) {
    const tenant = await this.tenantsRepo.findBySlug(slug);
    if (!tenant) throw new NotFoundException(`Fraccionamiento con slug "${slug}" no encontrado.`);
    if (!this.hasPremiumNotifications(tenant.modules)) {
      throw new ForbiddenException('Las notificaciones premium no están contratadas para este fraccionamiento.');
    }
    return tenant;
  }

  async getConfig(slug: string) {
    const tenant = await this.getPremiumTenant(slug);
    const channels = await this.notificationsRepo.findChannels(tenant.id);
    return {
      entitlement: 'NOTIFICATIONS_PREMIUM',
      channels: channels.map((channel) => ({ channel: channel.channel, enabled: channel.enabled, configured: true, updatedAt: channel.updated_at })),
    };
  }

  async saveConfig(slug: string, dto: NotificationConfigDto, updatedBy?: string) {
    const tenant = await this.getPremiumTenant(slug);
    const config = Object.fromEntries(Object.entries(dto).filter(([key, value]) => key !== 'channel' && value !== undefined));
    const saved = await this.notificationsRepo.upsert(tenant.id, dto.channel, Boolean(dto.enabled), config, updatedBy);
    return { entitlement: 'NOTIFICATIONS_PREMIUM', ...saved };
  }

  async removeConfig(slug: string, channel: 'SMTP' | 'WHATSAPP_BUSINESS') {
    const tenant = await this.getPremiumTenant(slug);
    await this.notificationsRepo.remove(tenant.id, channel);
    return { success: true };
  }
}