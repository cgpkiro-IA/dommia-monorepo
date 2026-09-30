import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { NoticesService } from '../services/notices.service';
import { CreateNoticeDto, UpdateNoticeDto } from '../dto/notice.dto';

@Controller('tenants/:slug/notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Get()
  async getNotices(
    @Param('slug') slug: string,
    @Query('publishedOnly') publishedOnly?: string,
    @Query('audience') audience?: string,
  ) {
    const isPublishedOnly = publishedOnly === 'true';
    const notices = await this.noticesService.getTenantNotices(slug, isPublishedOnly, audience);
    return {
      success: true,
      data: notices,
      count: notices.length,
    };
  }

  @Post(':id/acknowledge-guard')
  async acknowledgeNoticeByGuard(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() body: { guardUserId?: string; guardName?: string },
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
