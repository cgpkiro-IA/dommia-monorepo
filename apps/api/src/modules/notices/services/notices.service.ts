import { Injectable, NotFoundException } from '@nestjs/common';
import { NoticesRepository } from '../repositories/notices.repository';
import { TenantsRepository } from '../../tenants/repositories/tenants.repository';
import { CreateNoticeDto, UpdateNoticeDto } from '../dto/notice.dto';

@Injectable()
export class NoticesService {
  constructor(
    private readonly noticesRepo: NoticesRepository,
    private readonly tenantsRepo: TenantsRepository,
  ) {}

  private async validateTenant(slug: string) {
    const tenant = await this.tenantsRepo.findBySlug(slug);
    if (!tenant) {
      throw new NotFoundException(`Fraccionamiento con slug "${slug}" no encontrado`);
    }
    return tenant;
  }

  async getTenantNotices(slug: string, publishedOnly: boolean = false, audience?: string) {
    const tenant = await this.validateTenant(slug);
    return this.noticesRepo.findAllByTenant(tenant.slug, publishedOnly, audience);
  }

  async getNoticeById(slug: string, id: string) {
    const tenant = await this.validateTenant(slug);
    const notice = await this.noticesRepo.findById(tenant.slug, id);
    if (!notice) {
      throw new NotFoundException(`Aviso con ID "${id}" no encontrado`);
    }
    return notice;
  }

  async createTenantNotice(slug: string, dto: CreateNoticeDto) {
    const tenant = await this.validateTenant(slug);
    const authorName = dto.author_name?.trim() || dto.authorName?.trim() || 'Administración';
    const isPinned = dto.is_pinned !== undefined ? dto.is_pinned : (dto.isPinned ?? false);
    const isPublished = dto.is_published !== undefined ? dto.is_published : (dto.isPublished ?? true);
    const targetAudience = dto.target_audience || dto.targetAudience || (dto.category === 'GUARD_CONSIGN' ? 'GUARDS' : 'ALL');
    const expiresAt = dto.expires_at || dto.expiresAt;

    return this.noticesRepo.create(tenant.slug, {
      title: dto.title,
      content: dto.content,
      category: dto.category,
      priority: dto.priority,
      targetAudience,
      expiresAt,
      authorName,
      isPinned,
      isPublished,
    });
  }

  async updateTenantNotice(slug: string, id: string, dto: UpdateNoticeDto) {
    const tenant = await this.validateTenant(slug);
    const authorName = dto.author_name !== undefined ? dto.author_name.trim() : (dto.authorName !== undefined ? dto.authorName.trim() : undefined);
    const isPinned = dto.is_pinned !== undefined ? dto.is_pinned : dto.isPinned;
    const isPublished = dto.is_published !== undefined ? dto.is_published : dto.isPublished;
    const targetAudience = dto.target_audience || dto.targetAudience;
    const expiresAt = dto.expires_at || dto.expiresAt;

    const notice = await this.noticesRepo.update(tenant.slug, id, {
      title: dto.title,
      content: dto.content,
      category: dto.category,
      priority: dto.priority,
      targetAudience,
      expiresAt,
      authorName,
      isPinned,
      isPublished,
    });
    if (!notice) {
      throw new NotFoundException(`Aviso con ID "${id}" no encontrado para actualizar`);
    }
    return notice;
  }

  async acknowledgeNoticeByGuard(slug: string, id: string, guardUserId: string) {
    const tenant = await this.validateTenant(slug);
    const guardName = await this.noticesRepo.findAcknowledgingGuardName(guardUserId);
    if (!guardName) throw new NotFoundException('La cuenta que inició sesión ya no está activa.');
    const notice = await this.noticesRepo.acknowledgeByGuard(tenant.slug, id, guardUserId, guardName);
    if (!notice) {
      throw new NotFoundException(`Aviso con ID "${id}" no encontrado`);
    }
    return notice;
  }

  async deleteTenantNotice(slug: string, id: string) {
    const tenant = await this.validateTenant(slug);
    const deleted = await this.noticesRepo.delete(tenant.slug, id);
    if (!deleted) {
      throw new NotFoundException(`Aviso con ID "${id}" no encontrado para eliminar`);
    }
    return { message: 'Aviso eliminado correctamente.' };
  }
}
