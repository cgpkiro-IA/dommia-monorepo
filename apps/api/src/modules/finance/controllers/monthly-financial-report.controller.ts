import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from '../../auth/decorators/auth-metadata.decorator';
import { AdminSessionClaims } from '../../auth/guards/admin-session.guard';
import {
  ApproveExpenseDto,
  CreateExpenseDto,
  CreateMonthlyReportDto,
  PublishMonthlyReportDto,
  UploadFinancialEvidenceDto,
} from '../dto/monthly-financial-report.dto';
import { MonthlyReportAdminGuard } from '../guards/monthly-report-admin.guard';
import { MonthlyFinancialReportService } from '../services/monthly-financial-report.service';

@Controller('tenants/:slug/finance/monthly-reports')
@UseGuards(MonthlyReportAdminGuard)
@Roles('TENANT_ADMIN')
export class MonthlyFinancialReportController {
  constructor(private readonly reports: MonthlyFinancialReportService) {}

  @Get()
  async list(@Param('slug') slug: string) {
    return this.reports.listAdminReports(slug);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDraft(
    @Param('slug') slug: string,
    @Req() request: { user: AdminSessionClaims },
    @Body() dto: CreateMonthlyReportDto,
  ) {
    return this.reports.createDraft(slug, dto, request.user.sub);
  }

  @Get(':id')
  async get(@Param('slug') slug: string, @Param('id') id: string) {
    return this.reports.getAdminReport(slug, id);
  }

  @Post(':id/evidence')
  @HttpCode(HttpStatus.CREATED)
  async uploadReportEvidence(
    @Param('slug') slug: string,
    @Param('id') reportId: string,
    @Req() request: { user: AdminSessionClaims },
    @Body() dto: UploadFinancialEvidenceDto,
  ) {
    return this.reports.uploadReportEvidence(slug, reportId, dto, request.user.sub);
  }

  @Post(':id/expenses')
  @HttpCode(HttpStatus.CREATED)
  async createExpense(
    @Param('slug') slug: string,
    @Param('id') reportId: string,
    @Req() request: { user: AdminSessionClaims },
    @Body() dto: CreateExpenseDto,
  ) {
    return this.reports.createExpense(slug, reportId, dto, request.user.sub);
  }

  @Post('expenses/:expenseId/evidence')
  @HttpCode(HttpStatus.CREATED)
  async uploadEvidence(
    @Param('slug') slug: string,
    @Param('expenseId') expenseId: string,
    @Req() request: { user: AdminSessionClaims },
    @Body() dto: UploadFinancialEvidenceDto,
  ) {
    return this.reports.uploadExpenseEvidence(slug, expenseId, dto, request.user.sub);
  }

  @Post('expenses/:expenseId/approve')
  async approveExpense(
    @Param('slug') slug: string,
    @Param('expenseId') expenseId: string,
    @Req() request: { user: AdminSessionClaims },
    @Body() dto: ApproveExpenseDto,
  ) {
    return this.reports.approveExpense(slug, expenseId, dto, request.user.sub);
  }

  @Post(':id/publish')
  async publish(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Req() request: { user: AdminSessionClaims },
    @Body() dto: PublishMonthlyReportDto,
  ) {
    return this.reports.publish(slug, id, dto, request.user.sub);
  }

  @Get('evidence/:evidenceId/content')
  async downloadEvidence(
    @Param('slug') slug: string,
    @Param('evidenceId') evidenceId: string,
    @Res() response: Response,
  ) {
    const { evidence, content } = await this.reports.getAdminEvidence(slug, evidenceId);
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
