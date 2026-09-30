import { Controller, ForbiddenException, Get, Post, Put, Delete, Body, Param, Query, Req, HttpStatus, HttpCode, UseGuards } from '@nestjs/common';
import { NoticesService } from '../services/notices.service';
import { AcknowledgeGuardNoticeDto, CreateNoticeDto, UpdateNoticeDto } from '../dto/notice.dto';
import { AccessOperatorClaims, AccessOperatorGuard } from '../../access/guards/access-operator.guard';
import { FinanceAdminGuard } from '../../auth/guards/finance-admin.guard';
import { Roles } from '../../auth/decorators/auth-metadata.decorator';

@Controller('tenants/:slug/notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR', 'GUARD')
  @UseGuards(AccessOperatorGuard)
  async getNotices(
    @Param('slug') slug: string,
    @Req() request: { user: AccessOperatorClaims },
    @Query('publishedOnly') publishedOnly?: string,
    @Query('audience') audience?: string,
  ) {
    if (request.user.role === 'GUARD' && audience !== 'GUARDS') {
      throw new ForbiddenException('El personal de caseta solo puede consultar consignas de guardia.');
    }
    const isPublishedOnly = publishedOnly === 'true';
    const notices = await this.noticesService.getTenantNotices(slug, isPublishedOnly, audience);
    return {
      success: true,
      data: notices,
      count: notices.length,
    };
  }

  @Post(':id/acknowledge-guard')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR', 'GUARD')
  @UseGuards(AccessOperatorGuard)
  async acknowledgeNoticeByGuard(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() body: AcknowledgeGuardNoticeDto,
  ) {
    const notice = await this.noticesService.acknowledgeNoticeByGuard(
      slug,
      id,
      body.guardUserId || 'guard_shift',
      body.guardName || 'Guardia de Turno',
    );
    return {
      success: true,
      message: 'Consigna marcada como leída y confirmada.',
      data: notice,
    };
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR')
  @UseGuards(FinanceAdminGuard)
  async getNoticeById(
    @Param('slug') slug: string,
    @Param('id') id: string,
  ) {
    const notice = await this.noticesService.getNoticeById(slug, id);
    return {
      success: true,
      data: notice,
    };
  }

  @Post()
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR')
  @UseGuards(FinanceAdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async createNotice(
    @Param('slug') slug: string,
    @Body() dto: CreateNoticeDto,
  ) {
    const notice = await this.noticesService.createTenantNotice(slug, dto);
    return {
      success: true,
      message: `Aviso "${notice.title}" publicado exitosamente.`,
      data: notice,
    };
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR')
  @UseGuards(FinanceAdminGuard)
  async updateNotice(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() dto: UpdateNoticeDto,
  ) {
    const notice = await this.noticesService.updateTenantNotice(slug, id, dto);
    return {
      success: true,
      message: 'Aviso actualizado exitosamente.',
      data: notice,
    };
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR')
  @UseGuards(FinanceAdminGuard)
  async deleteNotice(
    @Param('slug') slug: string,
    @Param('id') id: string,
  ) {
    const result = await this.noticesService.deleteTenantNotice(slug, id);
    return {
      success: true,
      message: result.message,
    };
  }
}
