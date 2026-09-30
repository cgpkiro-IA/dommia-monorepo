import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { CreateExpenseDto, CreateMonthlyReportDto, UploadFinancialEvidenceDto } from '../dto/monthly-financial-report.dto';

@Injectable()
export class MonthlyFinancialReportRepository {
  constructor(private readonly db: DatabaseService) {}

  async getReportingStartMonth(slug: string) {
    const result = await this.db.queryTenant(slug, `
      SELECT reporting_start_month FROM financial_monthly_report_settings WHERE singleton = TRUE
    `);
    return result.rows[0]?.reporting_start_month as string | undefined;
  }

  async createDraft(slug: string, dto: CreateMonthlyReportDto, userId: string) {
    const periodStart = `${dto.year}-${String(dto.month).padStart(2, '0')}-01`;
    const existing = await this.db.queryTenant(slug, `
      SELECT * FROM financial_monthly_reports
      WHERE period_start = $1 AND status = 'DRAFT'
      LIMIT 1
    `, [periodStart]);
    if (existing.rows[0]) return existing.rows[0];

    const revision = await this.db.queryTenant(slug, `
      SELECT COALESCE(MAX(revision), 0) + 1 AS revision
      FROM financial_monthly_reports WHERE period_start = $1
    `, [periodStart]);
    const result = await this.db.queryTenant(slug, `
      INSERT INTO financial_monthly_reports (
        period_start, period_end, revision, opening_bank_balance, opening_cash_balance,
        created_by, supersedes_report_id
      ) VALUES (
        $1, (date_trunc('month', $1::date) + INTERVAL '1 month - 1 day')::date,
        $2, $3, $4, $5,
        (SELECT id FROM financial_monthly_reports WHERE period_start = $1 AND status = 'PUBLISHED' ORDER BY revision DESC LIMIT 1)
      ) RETURNING *
    `, [periodStart, revision.rows[0].revision, dto.openingBankBalance, dto.openingCashBalance, userId]);
    return result.rows[0];
  }

  async listReports(slug: string, publishedOnly: boolean) {
    if (!publishedOnly) {
      const requiredPeriods = await this.db.queryTenant(slug, `
        WITH current_month AS (
          SELECT date_trunc('month', CURRENT_DATE)::date AS period_start
        ), periods AS (
          SELECT generate_series(s.reporting_start_month, c.period_start, INTERVAL '1 month')::date AS period_start,
                 c.period_start AS current_period
          FROM financial_monthly_report_settings s
          CROSS JOIN current_month c
          WHERE s.singleton = TRUE
        )
        SELECT r.id, p.period_start,
          (date_trunc('month', p.period_start) + INTERVAL '1 month - 1 day')::date AS period_end,
          COALESCE(r.revision, 0) AS revision,
          COALESCE(r.status, CASE WHEN p.period_start = p.current_period THEN 'IN_PROGRESS' ELSE 'MISSING' END) AS status,
          COALESCE(r.opening_bank_balance, 0) AS opening_bank_balance,
          COALESCE(r.opening_cash_balance, 0) AS opening_cash_balance,
          r.reported_bank_balance, r.reported_cash_balance, r.calculated_closing_balance,
          r.variance, r.published_at,
          (SELECT COUNT(*)::int FROM financial_monthly_report_reviews rv WHERE rv.report_id = r.id) AS reviews_count
        FROM periods p
        LEFT JOIN LATERAL (
          SELECT report.* FROM financial_monthly_reports report
          WHERE report.period_start = p.period_start
          ORDER BY report.revision DESC LIMIT 1
        ) r ON TRUE
        ORDER BY p.period_start DESC
      `);
      return requiredPeriods.rows;
    }

    const result = await this.db.queryTenant(slug, `
      SELECT r.*,
        (SELECT COUNT(*)::int FROM financial_monthly_report_reviews rv WHERE rv.report_id = r.id) AS reviews_count
      FROM financial_monthly_reports r
      WHERE r.status = 'PUBLISHED'
      ORDER BY r.period_start DESC, r.revision DESC
    `);
    return result.rows;
  }

  async listPublishedForResident(slug: string, residentId: string) {
    const result = await this.db.queryTenant(slug, `
      SELECT r.id, r.period_start, r.period_end, r.revision, r.published_at,
        r.publication_notes, r.report_snapshot,
        EXISTS (
          SELECT 1 FROM financial_monthly_report_reviews rv
          WHERE rv.report_id = r.id AND rv.resident_id = $1
        ) AS reviewed_by_current_resident
      FROM financial_monthly_reports r
      WHERE r.status = 'PUBLISHED'
      ORDER BY r.period_start DESC, r.revision DESC
    `, [residentId]);
    return result.rows;
  }

  async getReport(slug: string, id: string) {
    const result = await this.db.queryTenant(slug, `
      SELECT r.*,
        (SELECT COUNT(*)::int FROM financial_monthly_report_reviews rv WHERE rv.report_id = r.id) AS reviews_count
      FROM financial_monthly_reports r WHERE r.id = $1
    `, [id]);
    return result.rows[0] || null;
  }

  async listExpenses(slug: string, reportId: string) {
    const result = await this.db.queryTenant(slug, `
      SELECT e.*,
        COALESCE(json_agg(json_build_object(
          'id', ev.id,
          'fileName', ev.original_file_name,
          'contentType', ev.content_type,
          'sizeBytes', ev.size_bytes,
          'visibility', ev.visibility,
          'isRedacted', ev.is_redacted
        ) ORDER BY ev.created_at) FILTER (WHERE ev.id IS NOT NULL), '[]'::json) AS evidence
      FROM financial_expenses e
      LEFT JOIN financial_report_evidence ev ON ev.expense_id = e.id
      WHERE e.report_id = $1
      GROUP BY e.id
      ORDER BY e.expense_date DESC, e.created_at DESC
    `, [reportId]);
    return result.rows;
  }

  async listReportEvidence(slug: string, reportId: string) {
    const result = await this.db.queryTenant(slug, `
      SELECT id, original_file_name AS "fileName", content_type AS "contentType",
             size_bytes AS "sizeBytes", visibility, is_redacted AS "isRedacted"
      FROM financial_report_evidence
      WHERE report_id = $1
      ORDER BY created_at
    `, [reportId]);
    return result.rows;
  }

  async createExpense(slug: string, reportId: string, dto: CreateExpenseDto, userId: string) {
    const result = await this.db.queryTenant(slug, `
      INSERT INTO financial_expenses (
        report_id, category, description, vendor_name, expense_date, amount, payment_method,
        reference, notes, created_by
      ) SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
        FROM financial_monthly_reports WHERE id = $1 AND status = 'DRAFT'
      RETURNING *
    `, [
      reportId,
      dto.category,
      dto.description.trim(),
      dto.vendorName?.trim() || null,
      dto.expenseDate,
      dto.amount,
      dto.paymentMethod,
      dto.reference?.trim() || null,
      dto.notes?.trim() || null,
      userId,
    ]);
    return result.rows[0];
  }

  async findExpense(slug: string, id: string) {
    const result = await this.db.queryTenant(slug, 'SELECT * FROM financial_expenses WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async approveExpense(slug: string, id: string, userId: string, exceptionReason?: string) {
    const result = await this.db.queryTenant(slug, `
      UPDATE financial_expenses
      SET status = 'APPROVED', approved_by = $2, approved_at = NOW(),
          evidence_exception_reason = $3::text, updated_at = NOW()
      WHERE id = $1 AND status = 'DRAFT'
        AND ($3::text IS NOT NULL OR EXISTS (SELECT 1 FROM financial_report_evidence ev WHERE ev.expense_id = financial_expenses.id))
      RETURNING *
    `, [id, userId, exceptionReason?.trim() || null]);
    return result.rows[0] || null;
  }

  async addEvidence(slug: string, input: {
    expenseId: string;
    objectKey: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
    sha256: string;
    visibility: UploadFinancialEvidenceDto['visibility'];
    isRedacted: boolean;
    userId: string;
  }) {
    const result = await this.db.queryTenant(slug, `
      INSERT INTO financial_report_evidence (
        expense_id, object_key, original_file_name, content_type, size_bytes,
        sha256, visibility, is_redacted, uploaded_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [input.expenseId, input.objectKey, input.fileName, input.contentType, input.sizeBytes, input.sha256, input.visibility, input.isRedacted, input.userId]);
    return result.rows[0];
  }

  async addReportEvidence(slug: string, input: {
    reportId: string;
    objectKey: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
    sha256: string;
    visibility: UploadFinancialEvidenceDto['visibility'];
    isRedacted: boolean;
    userId: string;
  }) {
    const result = await this.db.queryTenant(slug, `
      INSERT INTO financial_report_evidence (
        report_id, object_key, original_file_name, content_type, size_bytes,
        sha256, visibility, is_redacted, uploaded_by
      ) SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9
        FROM financial_monthly_reports WHERE id = $1 AND status = 'DRAFT'
      RETURNING *
    `, [input.reportId, input.objectKey, input.fileName, input.contentType, input.sizeBytes, input.sha256, input.visibility, input.isRedacted, input.userId]);
    return result.rows[0] || null;
  }

  async findEvidence(slug: string, id: string) {
    const result = await this.db.queryTenant(slug, `
      SELECT ev.*, e.expense_date, e.status AS expense_status
      FROM financial_report_evidence ev
      LEFT JOIN financial_expenses e ON e.id = ev.expense_id
      WHERE ev.id = $1
    `, [id]);
    return result.rows[0] || null;
  }

  async findResidentEvidence(slug: string, id: string) {
    const result = await this.db.queryTenant(slug, `
      SELECT ev.*
      FROM financial_report_evidence ev
      LEFT JOIN financial_expenses e ON e.id = ev.expense_id
      WHERE ev.id = $1
        AND ev.visibility = 'RESIDENTS'
        AND ev.is_redacted = TRUE
        AND (e.id IS NULL OR e.status = 'APPROVED')
        AND EXISTS (
          SELECT 1 FROM financial_monthly_reports r
          WHERE r.id = COALESCE(ev.report_id, e.report_id) AND r.status = 'PUBLISHED'
        )
    `, [id]);
    return result.rows[0] || null;
  }

  async getPeriodData(slug: string, reportId: string, periodStart: string, periodEnd: string) {
    const [payments, annualPayments, expenses, pendingPayments, charges] = await Promise.all([
      this.db.queryTenant(slug, `
        SELECT
          p.paid_at::date AS date,
          CASE
            WHEN p.charge_id IS NULL THEN 'ADVANCE_MAINTENANCE'
            WHEN fc.fee_type = 'EXTRAORDINARY' THEN 'EXTRAORDINARY_FEE'
            ELSE 'MAINTENANCE_FEE'
          END AS category,
          p.payment_method,
          COUNT(*)::int AS count,
          COALESCE(SUM(p.amount), 0)::numeric(14,2) AS amount
        FROM financial_payments p
        LEFT JOIN financial_charges c ON c.id = p.charge_id
        LEFT JOIN fee_configurations fc ON fc.id = c.fee_config_id
        WHERE p.status = 'APPROVED' AND p.paid_at::date BETWEEN $1 AND $2
        GROUP BY 1, 2, 3 ORDER BY 1, 2, 3
      `, [periodStart, periodEnd]),
      this.db.queryTenant(slug, `
        SELECT reviewed_at::date AS date, payment_method, COUNT(*)::int AS count,
          COALESCE(SUM(net_amount), 0)::numeric(14,2) AS amount
        FROM annual_payment_commitments
        WHERE status = 'APPROVED' AND reviewed_at::date BETWEEN $1 AND $2
        GROUP BY reviewed_at::date, payment_method ORDER BY reviewed_at::date, payment_method
      `, [periodStart, periodEnd]),
      this.db.queryTenant(slug, `
        SELECT category, COUNT(*)::int AS count,
          COALESCE(SUM(amount), 0)::numeric(14,2) AS amount
        FROM financial_expenses
        WHERE report_id = $1 AND status = 'APPROVED'
        GROUP BY category ORDER BY category
      `, [reportId]),
      this.db.queryTenant(slug, `
        SELECT COUNT(*)::int AS count,
          COALESCE(SUM(amount), 0)::numeric(14,2) AS amount
        FROM financial_payments
        WHERE status = 'PENDING_APPROVAL' AND paid_at::date BETWEEN $1 AND $2
      `, [periodStart, periodEnd]),
      this.db.queryTenant(slug, `
        SELECT COUNT(*)::int AS count,
          COALESCE(SUM(amount), 0)::numeric(14,2) AS amount,
          COALESCE(SUM(balance_due), 0)::numeric(14,2) AS balance_due
        FROM financial_charges
        WHERE due_date BETWEEN $1 AND $2
      `, [periodStart, periodEnd]),
    ]);
    return {
      payments: payments.rows,
      annualPayments: annualPayments.rows,
      expenses: expenses.rows,
      pendingPayments: pendingPayments.rows[0],
      charges: charges.rows[0],
    };
  }

  async countDraftExpenses(slug: string, reportId: string) {
    const result = await this.db.queryTenant(slug, `
      SELECT COUNT(*)::int AS count FROM financial_expenses
      WHERE report_id = $1 AND status = 'DRAFT'
    `, [reportId]);
    return result.rows[0]?.count || 0;
  }

  async publishReport(slug: string, id: string, input: {
    userId: string;
    reportedBankBalance: number;
    reportedCashBalance: number;
    calculatedClosingBalance: number;
    variance: number;
    publicationNotes?: string;
    snapshot: Record<string, unknown>;
  }) {
    const result = await this.db.queryTenant(slug, `
      UPDATE financial_monthly_reports
      SET status = 'PUBLISHED', reported_bank_balance = $2, reported_cash_balance = $3,
          calculated_closing_balance = $4, variance = $5, publication_notes = $6,
          report_snapshot = $7::jsonb, published_by = $8, published_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND status = 'DRAFT'
        AND NOT EXISTS (SELECT 1 FROM financial_expenses e WHERE e.report_id = financial_monthly_reports.id AND e.status = 'DRAFT')
      RETURNING *
    `, [id, input.reportedBankBalance, input.reportedCashBalance, input.calculatedClosingBalance, input.variance, input.publicationNotes?.trim() || null, JSON.stringify(input.snapshot), input.userId]);
    return result.rows[0] || null;
  }

  async markReviewed(slug: string, reportId: string, residentId: string) {
    const result = await this.db.queryTenant(slug, `
      INSERT INTO financial_monthly_report_reviews (report_id, resident_id)
      SELECT id, $2 FROM financial_monthly_reports WHERE id = $1 AND status = 'PUBLISHED'
      ON CONFLICT (report_id, resident_id) DO UPDATE SET reviewed_at = NOW()
      RETURNING reviewed_at
    `, [reportId, residentId]);
    return result.rows[0] || null;
  }
}
