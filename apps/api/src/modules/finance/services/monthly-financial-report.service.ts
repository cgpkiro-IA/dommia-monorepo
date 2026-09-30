import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantsRepository } from '../../tenants/repositories/tenants.repository';
import {
  ApproveExpenseDto,
  CreateExpenseDto,
  CreateMonthlyReportDto,
  PublishMonthlyReportDto,
  UploadFinancialEvidenceDto,
} from '../dto/monthly-financial-report.dto';
import { MonthlyFinancialReportRepository } from '../repositories/monthly-financial-report.repository';
import { FinancialEvidenceStorageService } from './financial-evidence-storage.service';

@Injectable()
export class MonthlyFinancialReportService {
  constructor(
    private readonly repository: MonthlyFinancialReportRepository,
    private readonly tenants: TenantsRepository,
    private readonly evidenceStorage: FinancialEvidenceStorageService,
  ) {}

  async createDraft(slug: string, dto: CreateMonthlyReportDto, userId: string) {
    const tenant = await this.requireTenant(slug);
    const periodStart = `${dto.year}-${String(dto.month).padStart(2, '0')}-01`;
    const reportingStart = await this.repository.getReportingStartMonth(tenant.slug);
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const currentPeriod = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-01`;
    if (!reportingStart || periodStart < this.dateOnly(reportingStart) || periodStart > currentPeriod) {
      throw new BadRequestException('El periodo está fuera del intervalo de rendición habilitado para este fraccionamiento.');
    }
    return {
      success: true,
      data: await this.repository.createDraft(tenant.slug, dto, userId),
    };
  }

  async listAdminReports(slug: string) {
    const tenant = await this.requireTenant(slug);
    return { success: true, data: await this.repository.listReports(tenant.slug, false) };
  }

  async getAdminReport(slug: string, id: string) {
    const tenant = await this.requireTenant(slug);
    const report = await this.requireReport(tenant.slug, id);
    const [expenses, reportEvidence, current] = await Promise.all([
      this.repository.listExpenses(tenant.slug, report.id),
      this.repository.listReportEvidence(tenant.slug, report.id),
      this.repository.getPeriodData(tenant.slug, report.id, report.period_start, report.period_end),
    ]);
    return { success: true, data: { ...report, expenses, reportEvidence, current } };
  }

  async createExpense(slug: string, reportId: string, dto: CreateExpenseDto, userId: string) {
    const tenant = await this.requireTenant(slug);
    const report = await this.requireDraft(tenant.slug, reportId);
    if (dto.expenseDate < this.dateOnly(report.period_start) || dto.expenseDate > this.dateOnly(report.period_end)) {
      throw new BadRequestException('La fecha del gasto debe pertenecer al periodo de la rendición.');
    }
    return {
      success: true,
      data: await this.repository.createExpense(tenant.slug, reportId, dto, userId),
    };
  }

  async uploadExpenseEvidence(slug: string, expenseId: string, dto: UploadFinancialEvidenceDto, userId: string) {
    const tenant = await this.requireTenant(slug);
    const expense = await this.repository.findExpense(tenant.slug, expenseId);
    if (!expense || expense.status !== 'DRAFT') {
      throw new NotFoundException('El gasto no existe o ya no admite evidencia.');
    }
    if (dto.visibility === 'RESIDENTS' && !dto.isRedacted) {
      throw new BadRequestException('La evidencia visible para residentes debe estar redactada.');
    }

    const stored = await this.evidenceStorage.store(tenant.slug, dto.contentBase64, dto.contentType);
    try {
      const evidence = await this.repository.addEvidence(tenant.slug, {
        expenseId,
        objectKey: stored.objectKey,
        fileName: dto.fileName.trim(),
        contentType: dto.contentType,
        sizeBytes: stored.sizeBytes,
        sha256: stored.sha256,
        visibility: dto.visibility,
        isRedacted: dto.isRedacted,
        userId,
      });
      return { success: true, data: evidence };
    } catch (error) {
      await this.evidenceStorage.remove(stored.objectKey);
      throw error;
    }
  }

  async uploadReportEvidence(slug: string, reportId: string, dto: UploadFinancialEvidenceDto, userId: string) {
    const tenant = await this.requireTenant(slug);
    await this.requireDraft(tenant.slug, reportId);
    if (dto.visibility === 'RESIDENTS' && !dto.isRedacted) {
      throw new BadRequestException('La evidencia visible para residentes debe estar redactada.');
    }
    const stored = await this.evidenceStorage.store(tenant.slug, dto.contentBase64, dto.contentType);
    try {
      const evidence = await this.repository.addReportEvidence(tenant.slug, {
        reportId,
        objectKey: stored.objectKey,
        fileName: dto.fileName.trim(),
        contentType: dto.contentType,
        sizeBytes: stored.sizeBytes,
        sha256: stored.sha256,
        visibility: dto.visibility,
        isRedacted: dto.isRedacted,
        userId,
      });
      if (!evidence) throw new ConflictException('La rendición dejó de estar en borrador.');
      return { success: true, data: evidence };
    } catch (error) {
      await this.evidenceStorage.remove(stored.objectKey);
      throw error;
    }
  }

  async approveExpense(slug: string, expenseId: string, dto: ApproveExpenseDto, userId: string) {
    const tenant = await this.requireTenant(slug);
    const expense = await this.repository.approveExpense(tenant.slug, expenseId, userId, dto.evidenceExceptionReason);
    if (!expense) {
      throw new BadRequestException('El gasto requiere evidencia o una justificación de excepción y debe seguir en borrador.');
    }
    return { success: true, data: expense };
  }

  async publish(slug: string, reportId: string, dto: PublishMonthlyReportDto, userId: string) {
    const tenant = await this.requireTenant(slug);
    const report = await this.requireDraft(tenant.slug, reportId);
    const drafts = await this.repository.countDraftExpenses(tenant.slug, report.id);
    if (drafts > 0) throw new ConflictException(`Hay ${drafts} gasto(s) sin aprobar en el periodo.`);

    const [periodData, expenses] = await Promise.all([
      this.repository.getPeriodData(tenant.slug, report.id, report.period_start, report.period_end),
      this.repository.listExpenses(tenant.slug, report.id),
    ]);
    const paymentIncome = periodData.payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const annualIncome = this.round(periodData.annualPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0));
    const totalIncome = this.round(paymentIncome + annualIncome);
    const totalExpenses = this.round(periodData.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0));
    const openingBalance = this.round(Number(report.opening_bank_balance) + Number(report.opening_cash_balance));
    const calculatedClosingBalance = this.round(openingBalance + totalIncome - totalExpenses);
    const reportedClosingBalance = this.round(dto.reportedBankBalance + dto.reportedCashBalance);
    const variance = this.round(reportedClosingBalance - calculatedClosingBalance);
    if (Math.abs(variance) > 0.01 && !dto.publicationNotes?.trim()) {
      throw new BadRequestException('Debes explicar la diferencia de conciliación antes de publicar.');
    }

    const snapshot = {
      schemaVersion: 1,
      periodStart: this.dateOnly(report.period_start),
      periodEnd: this.dateOnly(report.period_end),
      revision: report.revision,
      opening: {
        bank: Number(report.opening_bank_balance),
        cash: Number(report.opening_cash_balance),
        total: openingBalance,
      },
      income: {
        total: totalIncome,
        regular: periodData.payments.map((item) => ({
          date: this.dateOnly(item.date),
          category: item.category,
          paymentMethod: item.payment_method,
          count: Number(item.count),
          amount: Number(item.amount),
        })),
        annualAdvance: {
          count: periodData.annualPayments.reduce((sum, item) => sum + Number(item.count || 0), 0),
          amount: annualIncome,
          entries: periodData.annualPayments.map((item) => ({
            date: this.dateOnly(item.date),
            paymentMethod: item.payment_method,
            count: Number(item.count),
            amount: Number(item.amount),
          })),
        },
      },
      expenses: {
        total: totalExpenses,
        byCategory: periodData.expenses.map((item) => ({
          category: item.category,
          count: Number(item.count),
          amount: Number(item.amount),
        })),
        items: expenses
          .filter((item) => item.status === 'APPROVED')
          .map((item) => ({
            id: item.id,
            category: item.category,
            description: item.description,
            vendorName: item.vendor_name,
            expenseDate: this.dateOnly(item.expense_date),
            amount: Number(item.amount),
            paymentMethod: item.payment_method,
            reference: item.reference,
            evidenceExceptionReason: item.evidence_exception_reason,
            evidence: (item.evidence || [])
              .filter((evidence) => evidence.visibility === 'RESIDENTS' && evidence.isRedacted)
              .map((evidence) => ({
                id: evidence.id,
                fileName: evidence.fileName,
                contentType: evidence.contentType,
                sizeBytes: evidence.sizeBytes,
              })),
          })),
      },
      reportEvidence: (await this.repository.listReportEvidence(tenant.slug, report.id))
        .filter((evidence) => evidence.visibility === 'RESIDENTS' && evidence.isRedacted)
        .map((evidence) => ({
          id: evidence.id,
          fileName: evidence.fileName,
          contentType: evidence.contentType,
          sizeBytes: evidence.sizeBytes,
        })),
      activity: {
        pendingPaymentCount: Number(periodData.pendingPayments?.count || 0),
        pendingPaymentAmount: Number(periodData.pendingPayments?.amount || 0),
        chargesIssuedCount: Number(periodData.charges?.count || 0),
        chargesIssuedAmount: Number(periodData.charges?.amount || 0),
        chargesOutstandingAmount: Number(periodData.charges?.balance_due || 0),
      },
      closing: {
        calculated: calculatedClosingBalance,
        reportedBank: dto.reportedBankBalance,
        reportedCash: dto.reportedCashBalance,
        reportedTotal: reportedClosingBalance,
        variance,
      },
    };

    const published = await this.repository.publishReport(tenant.slug, reportId, {
      userId,
      reportedBankBalance: dto.reportedBankBalance,
      reportedCashBalance: dto.reportedCashBalance,
      calculatedClosingBalance,
      variance,
      publicationNotes: dto.publicationNotes,
      snapshot,
    });
    if (!published) throw new ConflictException('La rendición ya fue publicada o no existe.');
    return { success: true, message: 'Rendición mensual publicada para los residentes.', data: published };
  }

  async listPublished(slug: string, residentId: string) {
    const tenant = await this.requireTenant(slug);
    return { success: true, data: await this.repository.listPublishedForResident(tenant.slug, residentId) };
  }

  async getPublished(slug: string, id: string) {
    const tenant = await this.requireTenant(slug);
    const report = await this.requireReport(tenant.slug, id);
    if (report.status !== 'PUBLISHED') throw new NotFoundException('La rendición publicada no existe.');
    return {
      success: true,
      data: {
        id: report.id,
        periodStart: report.period_start,
        periodEnd: report.period_end,
        revision: report.revision,
        publishedAt: report.published_at,
        publicationNotes: report.publication_notes,
        snapshot: report.report_snapshot,
      },
    };
  }

  async markReviewed(slug: string, reportId: string, residentId: string) {
    const tenant = await this.requireTenant(slug);
    const reviewed = await this.repository.markReviewed(tenant.slug, reportId, residentId);
    if (!reviewed) throw new NotFoundException('La rendición publicada no existe.');
    return { success: true, data: { reviewedAt: reviewed.reviewed_at } };
  }

  async getAdminEvidence(slug: string, evidenceId: string) {
    const tenant = await this.requireTenant(slug);
    const evidence = await this.repository.findEvidence(tenant.slug, evidenceId);
    if (!evidence) throw new NotFoundException('La evidencia no existe.');
    return { evidence, content: await this.evidenceStorage.read(evidence.object_key) };
  }

  async getResidentEvidence(slug: string, evidenceId: string) {
    const tenant = await this.requireTenant(slug);
    const evidence = await this.repository.findResidentEvidence(tenant.slug, evidenceId);
    if (!evidence) throw new NotFoundException('La evidencia publicada no existe.');
    return { evidence, content: await this.evidenceStorage.read(evidence.object_key) };
  }

  private async requireTenant(slug: string) {
    const tenant = await this.tenants.findBySlug(slug);
    if (!tenant) throw new NotFoundException('El fraccionamiento no existe.');
    return tenant;
  }

  private async requireReport(slug: string, id: string) {
    const report = await this.repository.getReport(slug, id);
    if (!report) throw new NotFoundException('La rendición mensual no existe.');
    return report;
  }

  private async requireDraft(slug: string, id: string) {
    const report = await this.requireReport(slug, id);
    if (report.status !== 'DRAFT') throw new ConflictException('La rendición ya fue publicada y es inmutable.');
    return report;
  }

  private dateOnly(value: string | Date) {
    return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
  }

  private round(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
