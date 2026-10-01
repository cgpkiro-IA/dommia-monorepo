import { Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from '../../auth/decorators/auth-metadata.decorator';
import { ResidentAuthGuard, ResidentSessionClaims } from '../../auth/guards/resident-auth.guard';
import { MonthlyFinancialReportService } from '../services/monthly-financial-report.service';

@Controller('auth/resident/finance/monthly-reports')
@UseGuards(ResidentAuthGuard)
@Roles('RESIDENT')
export class ResidentMonthlyFinancialReportController {
  constructor(private readonly reports: MonthlyFinancialReportService) {}

  @Get()
  async list(@Req() request: { user: ResidentSessionClaims }) {
    return this.reports.listPublished(request.user.tenantSlug, request.user.sub);
  }

  @Get(':id')
  async get(@Param('id') id: string, @Req() request: { user: ResidentSessionClaims }) {
    return this.reports.getPublished(request.user.tenantSlug, id);
  }

  @Post(':id/review')
  async review(@Param('id') id: string, @Req() request: { user: ResidentSessionClaims }) {
    return this.reports.markReviewed(request.user.tenantSlug, id, request.user.sub);
  }

  @Get('evidence/:evidenceId/content')
  async downloadEvidence(
    @Param('evidenceId') evidenceId: string,
    @Req() request: { user: ResidentSessionClaims },
    @Res() response: Response,
  ) {
    const { evidence, content } = await this.reports.getResidentEvidence(request.user.tenantSlug, evidenceId);
    response.set({
      'Content-Type': evidence.content_type,
      'Content-Length': String(content.length),
      'Content-Disposition': `attachment; filename="${this.safeFileName(evidence.original_file_name)}"`,
      'Cache-Control': 'private, no-store, max-age=0',
    });
    response.send(content);
  }

  private safeFileName(value: string) {
    return value.replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 180) || 'evidencia';
  }
}
