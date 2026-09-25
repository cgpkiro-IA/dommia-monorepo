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
let NoticesController = class NoticesController {
    noticesService;
    constructor(noticesService) {
        this.noticesService = noticesService;
    }
    async getNotices(slug, publishedOnly) {
        const isPublishedOnly = publishedOnly === 'true';
        const notices = await this.noticesService.getTenantNotices(slug, isPublishedOnly);
        return {
            success: true,
            data: notices,
            count: notices.length,
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
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)('publishedOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NoticesController.prototype, "getNotices", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NoticesController.prototype, "getNoticeById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, notice_dto_1.CreateNoticeDto]),
    __metadata("design:returntype", Promise)
], NoticesController.prototype, "createNotice", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, notice_dto_1.UpdateNoticeDto]),
    __metadata("design:returntype", Promise)
], NoticesController.prototype, "updateNotice", null);
__decorate([
    (0, common_1.Delete)(':id'),
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