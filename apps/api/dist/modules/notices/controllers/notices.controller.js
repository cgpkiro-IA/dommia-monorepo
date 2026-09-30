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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoticesController = void 0;
const common_1 = require("@nestjs/common");
const notices_service_1 = require("../services/notices.service");
const notice_dto_1 = require("../dto/notice.dto");
const access_operator_guard_1 = require("../../access/guards/access-operator.guard");
const finance_admin_guard_1 = require("../../auth/guards/finance-admin.guard");
const auth_metadata_decorator_1 = require("../../auth/decorators/auth-metadata.decorator");
let NoticesController = class NoticesController {
    noticesService;
    constructor(noticesService) {
        this.noticesService = noticesService;
    }
    async getNotices(slug, request, publishedOnly, audience) {
        if (request.user.role === 'GUARD' && audience !== 'GUARDS') {
            throw new common_1.ForbiddenException('El personal de caseta solo puede consultar consignas de guardia.');
        }
        const isPublishedOnly = publishedOnly === 'true';
        const notices = await this.noticesService.getTenantNotices(slug, isPublishedOnly, audience);
        return {
            success: true,
            data: notices,
            count: notices.length,
        };
    }
    async acknowledgeNoticeByGuard(slug, id, body) {
        const notice = await this.noticesService.acknowledgeNoticeByGuard(slug, id, body.guardUserId || 'guard_shift', body.guardName || 'Guardia de Turno');
        return {
            success: true,
            message: 'Consigna marcada como leída y confirmada.',
            data: notice,
        };
    }
    async getNoticeById(slug, id) {
        const notice = await this.noticesService.getNoticeById(slug, id);
        return {
            success: true,
            data: notice,
        };
    }
    async createNotice(slug, dto) {
        const notice = await this.noticesService.createTenantNotice(slug, dto);
        return {
            success: true,
            message: `Aviso "${notice.title}" publicado exitosamente.`,
            data: notice,
        };
    }
    async updateNotice(slug, id, dto) {
        const notice = await this.noticesService.updateTenantNotice(slug, id, dto);
        return {
            success: true,
            message: 'Aviso actualizado exitosamente.',
            data: notice,
        };
    }
    async deleteNotice(slug, id) {
        const result = await this.noticesService.deleteTenantNotice(slug, id);
        return {
            success: true,
            message: result.message,
        };
    }
};
exports.NoticesController = NoticesController;
__decorate([
    (0, common_1.Get)(),
    (0, auth_metadata_decorator_1.Roles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR', 'GUARD'),
    (0, common_1.UseGuards)(access_operator_guard_1.AccessOperatorGuard),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('publishedOnly')),
    __param(3, (0, common_1.Query)('audience')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", Promise)
], NoticesController.prototype, "getNotices", null);
__decorate([
    (0, common_1.Post)(':id/acknowledge-guard'),
    (0, auth_metadata_decorator_1.Roles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR', 'GUARD'),
    (0, common_1.UseGuards)(access_operator_guard_1.AccessOperatorGuard),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, notice_dto_1.AcknowledgeGuardNoticeDto]),
    __metadata("design:returntype", Promise)
], NoticesController.prototype, "acknowledgeNoticeByGuard", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, auth_metadata_decorator_1.Roles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR'),
    (0, common_1.UseGuards)(finance_admin_guard_1.FinanceAdminGuard),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NoticesController.prototype, "getNoticeById", null);
__decorate([
    (0, common_1.Post)(),
    (0, auth_metadata_decorator_1.Roles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR'),
    (0, common_1.UseGuards)(finance_admin_guard_1.FinanceAdminGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, notice_dto_1.CreateNoticeDto]),
    __metadata("design:returntype", Promise)
], NoticesController.prototype, "createNotice", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, auth_metadata_decorator_1.Roles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR'),
    (0, common_1.UseGuards)(finance_admin_guard_1.FinanceAdminGuard),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, notice_dto_1.UpdateNoticeDto]),
    __metadata("design:returntype", Promise)
], NoticesController.prototype, "updateNotice", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, auth_metadata_decorator_1.Roles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR'),
    (0, common_1.UseGuards)(finance_admin_guard_1.FinanceAdminGuard),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NoticesController.prototype, "deleteNotice", null);
exports.NoticesController = NoticesController = __decorate([
    (0, common_1.Controller)('tenants/:slug/notices'),
    __metadata("design:paramtypes", [notices_service_1.NoticesService])
], NoticesController);
//# sourceMappingURL=notices.controller.js.map