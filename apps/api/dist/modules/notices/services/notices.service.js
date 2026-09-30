"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoticesService = void 0;
const common_1 = require("@nestjs/common");
const notices_repository_1 = require("../repositories/notices.repository");
const tenants_repository_1 = require("../../tenants/repositories/tenants.repository");
let NoticesService = class NoticesService {
    noticesRepo;
    tenantsRepo;
    constructor(noticesRepo, tenantsRepo) {
        this.noticesRepo = noticesRepo;
        this.tenantsRepo = tenantsRepo;
    }
    async validateTenant(slug) {
        const tenant = await this.tenantsRepo.findBySlug(slug);
        if (!tenant) {
            throw new common_1.NotFoundException(`Fraccionamiento con slug "${slug}" no encontrado`);
        }
        return tenant;
    }
    async getTenantNotices(slug, publishedOnly = false, audience) {
        const tenant = await this.validateTenant(slug);
        return this.noticesRepo.findAllByTenant(tenant.slug, publishedOnly, audience);
    }
    async getNoticeById(slug, id) {
        const tenant = await this.validateTenant(slug);
        const notice = await this.noticesRepo.findById(tenant.slug, id);
        if (!notice) {
            throw new common_1.NotFoundException(`Aviso con ID "${id}" no encontrado`);
        }
        return notice;
    }
    async createTenantNotice(slug, dto) {
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
    async updateTenantNotice(slug, id, dto) {
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
            throw new common_1.NotFoundException(`Aviso con ID "${id}" no encontrado para actualizar`);
        }
        return notice;
    }
    async acknowledgeNoticeByGuard(slug, id, guardUserId, guardName) {
        const tenant = await this.validateTenant(slug);
        const notice = await this.noticesRepo.acknowledgeByGuard(tenant.slug, id, guardUserId, guardName);
        if (!notice) {
            throw new common_1.NotFoundException(`Aviso con ID "${id}" no encontrado`);
        }
        return notice;
    }
    async deleteTenantNotice(slug, id) {
        const tenant = await this.validateTenant(slug);
        const deleted = await this.noticesRepo.delete(tenant.slug, id);
        if (!deleted) {
            throw new common_1.NotFoundException(`Aviso con ID "${id}" no encontrado para eliminar`);
        }
        return { message: 'Aviso eliminado correctamente.' };
    }
};
exports.NoticesService = NoticesService;
exports.NoticesService = NoticesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notices_repository_1.NoticesRepository,
        tenants_repository_1.TenantsRepository])
], NoticesService);
//# sourceMappingURL=notices.service.js.map