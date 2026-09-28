import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import {
  CreatePaymentDto,
  QueryChargesDto,
  QueryPaymentsDto,
  SubmitSpeiPaymentDto,
  CreateAnnualCampaignDto,
  AnnualCampaignQuoteDto,
  SubmitAnnualPaymentDto,
} from '../dto/financial-operations.dto';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

@Injectable()
export class BillingEngineRepository {
  constructor(private readonly db: DatabaseService) {}

  async listAnnualCampaigns(slug: string) {
    const result = await this.db.queryTenant(slug, `
      SELECT c.*, COUNT(ac.id)::int AS commitments_count,
        COUNT(ac.id) FILTER (WHERE ac.status = 'APPROVED')::int AS approved_count,
        COALESCE(SUM(ac.net_amount) FILTER (WHERE ac.status = 'APPROVED'), 0)::numeric(12,2) AS approved_amount,
        COALESCE(SUM(ac.discount_amount) FILTER (WHERE ac.status = 'APPROVED'), 0)::numeric(12,2) AS approved_discount
      FROM annual_payment_campaigns c
      LEFT JOIN annual_payment_commitments ac ON ac.campaign_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    return result.rows;
  }

  async createAnnualCampaign(slug: string, data: CreateAnnualCampaignDto) {
    const result = await this.db.queryTenant(slug, `
      INSERT INTO annual_payment_campaigns
        (name, discount_percentage, months_covered, period_start, period_end, status)
      VALUES ($1, $2, $3, $4, $5, 'ACTIVE') RETURNING *
    `, [data.name.trim(), data.discountPercentage, data.monthsCovered || 12, data.periodStart, data.periodEnd]);
    return result.rows[0];
  }

  async getAnnualCampaignQuote(slug: string, campaignId: string, data: AnnualCampaignQuoteDto) {
    const campaignRes = await this.db.queryTenant(slug, `SELECT * FROM annual_payment_campaigns WHERE id = $1 AND status = 'ACTIVE'`, [campaignId]);
    const campaign = campaignRes.rows[0];
    if (!campaign) return null;
    const propertyRes = await this.db.queryTenant(slug, `SELECT id, street, exterior_number FROM properties WHERE id = $1`, [data.propertyId]);
    const property = propertyRes.rows[0];
    if (!property) return { missingProperty: true };
    const feesRes = await this.db.queryTenant(slug, `SELECT base_amount, fee_type, frequency FROM fee_configurations WHERE is_active = true AND frequency = 'MONTHLY'`);
    const monthlyGross = feesRes.rows.reduce((total, fee) => total + (fee.fee_type === 'VARIABLE_LOT_SIZE' ? Number(fee.base_amount) * 200 : Number(fee.base_amount)), 0);
    const grossAmount = Math.round(monthlyGross * Number(campaign.months_covered) * 100) / 100;
    const discountAmount = Math.round(grossAmount * Number(campaign.discount_percentage) / 100 * 100) / 100;
    const netAmount = Math.round((grossAmount - discountAmount) * 100) / 100;
    const existingRes = await this.db.queryTenant(slug, `SELECT * FROM annual_payment_commitments WHERE campaign_id = $1 AND property_id = $2`, [campaignId, data.propertyId]);
    return { campaign, property, grossAmount, discountAmount, netAmount, existingCommitment: existingRes.rows[0] || null };
  }

  async submitAnnualPayment(slug: string, campaignId: string, data: SubmitAnnualPaymentDto, paymentMethod: 'SPEI_TRANSFER' | 'CASH') {
    const quote = await this.getAnnualCampaignQuote(slug, campaignId, { propertyId: data.propertyId });
    if (!quote) return null;
    if (quote.missingProperty) return quote;
    if (quote.existingCommitment) return { duplicateCommitment: true };
    if (Math.abs(Number(data.amount) - Number(quote.netAmount)) > 0.01) return { invalidAmount: true, expectedAmount: quote.netAmount };
    const result = await this.db.queryTenant(slug, `
      INSERT INTO annual_payment_commitments
        (campaign_id, property_id, gross_amount, discount_amount, net_amount, payment_method, reference, receipt_url, status, payer_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
    `, [campaignId, data.propertyId, quote.grossAmount, quote.discountAmount, quote.netAmount, paymentMethod, data.reference.trim(), data.receiptUrl || null, paymentMethod === 'CASH' ? 'PENDING_APPROVAL' : 'PENDING_APPROVAL', data.payerName || null]);
    return { commitment: result.rows[0], quote };
  }

  async listAnnualCommitments(slug: string, campaignId: string) {
    const result = await this.db.queryTenant(slug, `
      SELECT ac.*, p.street, p.exterior_number, c.period_start, c.period_end, c.months_covered,
             (SELECT COUNT(*)::int FROM annual_payment_allocations aa WHERE aa.commitment_id = ac.id) AS allocation_count,
             EXISTS (
               SELECT 1 FROM financial_ledger_entries le
               WHERE le.source_id = ac.id AND le.source_type = 'ANNUAL_CAMPAIGN' AND le.entry_type = 'PAYMENT'
             ) AS ledger_recorded
      FROM annual_payment_commitments ac
      JOIN properties p ON p.id = ac.property_id
      JOIN annual_payment_campaigns c ON c.id = ac.campaign_id
      WHERE ac.campaign_id = $1
      ORDER BY ac.created_at DESC
    `, [campaignId]);
    return result.rows;
  }

  async reviewAnnualCommitment(slug: string, id: string, status: 'APPROVED' | 'REJECTED', reviewedByName: string, notes?: string) {
    const pendingResult = await this.db.queryTenant(slug, `
      SELECT ac.*, c.period_start, c.months_covered
      FROM annual_payment_commitments ac
      JOIN annual_payment_campaigns c ON c.id = ac.campaign_id
      WHERE ac.id = $1 AND ac.status = 'PENDING_APPROVAL'
    `, [id]);
    const pending = pendingResult.rows[0];
    if (!pending) return null;

    const result = await this.db.queryTenant(slug, `
      UPDATE annual_payment_commitments
      SET status = $1, reviewed_by_name = $2, review_notes = COALESCE($3, review_notes), reviewed_at = NOW()
      WHERE id = $4 AND status = 'PENDING_APPROVAL'
      RETURNING *
    `, [status, reviewedByName, notes || null, id]);
    const commitment = result.rows[0];
    if (!commitment || status !== 'APPROVED') return commitment || null;

    await this.db.queryTenant(slug, `
      INSERT INTO financial_ledger_entries (property_id, source_type, source_id, entry_type, amount, description)
      VALUES ($1, 'ANNUAL_CAMPAIGN', $2, 'PAYMENT', $3, 'Pago anual aprobado por campaña')
      ON CONFLICT DO NOTHING
    `, [commitment.property_id, commitment.id, commitment.net_amount]);

    const months = Number(pending.months_covered || 12);
    const start = new Date(pending.period_start);
    if (Number.isNaN(start.getTime())) throw new Error('La campaña anual tiene un periodo inicial inválido.');
    const monthlyAmount = Math.floor((Number(commitment.net_amount) / months) * 100) / 100;
    for (let index = 0; index < months; index += 1) {
      const periodStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1));
      const periodEnd = new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 0));
      const amount = index === months - 1
        ? Number(commitment.net_amount) - monthlyAmount * (months - 1)
        : monthlyAmount;
      await this.db.queryTenant(slug, `
        INSERT INTO annual_payment_allocations (commitment_id, property_id, period_start, period_end, amount)
        VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING
      `, [commitment.id, commitment.property_id, periodStart.toISOString().slice(0, 10), periodEnd.toISOString().slice(0, 10), amount]);
    }
    return commitment;
  }

  async generateMonthlyCharges(
    slug: string,
    year: number,
    month: number,
    dryRun: boolean = false,
  ) {
    const monthName = MONTH_NAMES[month - 1] || `Mes ${month}`;

    // 1. Fetch active fee configurations
    const feesRes = await this.db.queryTenant(
      slug,
      `SELECT * FROM fee_configurations WHERE is_active = true ORDER BY created_at ASC`,
    );
    const activeFees = feesRes.rows;

    // 2. Fetch all properties
    const propsRes = await this.db.queryTenant(
      slug,
      `SELECT id, street, exterior_number, interior_number, block, lot, lot_size_m2, building_size_m2 
       FROM properties 
       ORDER BY street, exterior_number`,
    );
    const properties = propsRes.rows;

    const generatedCharges: any[] = [];
    let totalProjectedAmount = 0;

    for (const property of properties) {
      for (const fee of activeFees) {
        // Idempotency check: see if charge already exists for this property, fee, year and month
        const checkRes = await this.db.queryTenant(
          slug,
          `SELECT id, amount, status FROM financial_charges 
           WHERE property_id = $1 AND fee_config_id = $2 AND period_year = $3 AND period_month = $4`,
          [property.id, fee.id, year, month],
        );

        if (checkRes.rows.length > 0) {
          // Already generated, skip
          continue;
        }

        // Calculate amount
        let amount = Number(fee.base_amount);
        if (fee.fee_type === 'VARIABLE_LOT_SIZE') {
          const lotSize = Number(property.lot_size_m2) || 200;
          amount = Math.round(Number(fee.base_amount) * lotSize * 100) / 100;
        }

        totalProjectedAmount += amount;

        // Calculate due date (safe clamp for month days)
        const dueDay = Math.min(fee.due_day || 10, 28);
        const mm = String(month).padStart(2, '0');
        const dd = String(dueDay).padStart(2, '0');
        const dueDate = `${year}-${mm}-${dd}`;

        const concept = `${fee.name} - ${monthName} ${year}`;

        if (!dryRun) {
          const insertRes = await this.db.queryTenant(
            slug,
            `INSERT INTO financial_charges (
              property_id, fee_config_id, concept, amount, balance_due, due_date, period_year, period_month, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
            ON CONFLICT DO NOTHING
            RETURNING *;`,
            [property.id, fee.id, concept, amount, amount, dueDate, year, month],
          );
          if (insertRes.rows.length === 0) {
            continue;
          }
          generatedCharges.push({
            ...insertRes.rows[0],
            propertyAddress: `${property.street} #${property.exterior_number}`,
          });
        } else {
          generatedCharges.push({
            property_id: property.id,
            propertyAddress: `${property.street} #${property.exterior_number}`,
            fee_config_id: fee.id,
            concept,
            amount,
            balance_due: amount,
            due_date: dueDate,
            period_year: year,
            period_month: month,
            status: 'PENDING',
          });
        }
      }
    }

    return {
      year,
      month,
      monthName,
      dryRun,
      totalProperties: properties.length,
      activeFeeConfigs: activeFees.length,
      chargesCount: generatedCharges.length,
      totalProjectedAmount: Math.round(totalProjectedAmount * 100) / 100,
      charges: generatedCharges,
    };
  }

  async findAllCharges(slug: string, filters: QueryChargesDto) {
    let query = `
      SELECT 
        c.id, c.property_id, c.fee_config_id, c.concept, c.amount, c.balance_due, 
        c.due_date, c.period_year, c.period_month, c.status, c.notes, c.created_at, c.updated_at,
        p.street, p.exterior_number, p.interior_number, p.block, p.lot, p.is_delinquent,
        fc.name as fee_name, fc.fee_type,
        (SELECT r.first_name || ' ' || r.last_name FROM residents r WHERE r.property_id = p.id AND r.is_primary = true LIMIT 1) as primary_resident_name,
        (SELECT r.phone FROM residents r WHERE r.property_id = p.id AND r.is_primary = true LIMIT 1) as primary_resident_phone,
        (SELECT r.email FROM residents r WHERE r.property_id = p.id AND r.is_primary = true LIMIT 1) as primary_resident_email
      FROM financial_charges c
      JOIN properties p ON c.property_id = p.id
      LEFT JOIN fee_configurations fc ON c.fee_config_id = fc.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (filters.propertyId) {
      query += ` AND c.property_id = $${idx++}`;
      params.push(filters.propertyId);
    }
    if (filters.status) {
      query += ` AND c.status = $${idx++}`;
      params.push(filters.status);
    }
    if (filters.year) {
      query += ` AND c.period_year = $${idx++}`;
      params.push(Number(filters.year));
    }
    if (filters.month) {
      query += ` AND c.period_month = $${idx++}`;
      params.push(Number(filters.month));
    }

    query += ` ORDER BY c.due_date DESC, c.created_at DESC`;

    const res = await this.db.queryTenant(slug, query, params);
    return res.rows;
  }

  async findChargeById(slug: string, id: string) {
    const res = await this.db.queryTenant(
      slug,
      `SELECT * FROM financial_charges WHERE id = $1`,
      [id],
    );
    return res.rows[0] || null;
  }

  async recordPayment(slug: string, data: CreatePaymentDto) {
    const propertyId = data.propertyId || data.property_id;
    if (!propertyId) return null;
    return this.db.withTenantTransaction(slug, async (client) => {
      const propertyRes = await client.query(
        `SELECT id, street, exterior_number FROM properties WHERE id = $1 FOR UPDATE`,
        [propertyId],
      );
      const property = propertyRes.rows[0];
      if (!property) return null;

      const now = new Date();
      const folio = data.reference?.trim() || `REC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      let targetChargeId = data.chargeId || data.charge_id || null;
      let targetCharge: any = null;

      if (targetChargeId) {
        const chargeRes = await client.query(`SELECT * FROM financial_charges WHERE id = $1 FOR UPDATE`, [targetChargeId]);
        targetCharge = chargeRes.rows[0];
        if (!targetCharge || targetCharge.property_id !== propertyId) return { invalidCharge: true };
      } else {
        const pendingRes = await client.query(
          `SELECT * FROM financial_charges WHERE property_id = $1 AND status IN ('PENDING', 'PARTIAL') ORDER BY due_date ASC, created_at ASC LIMIT 1 FOR UPDATE`,
          [propertyId],
        );
        targetCharge = pendingRes.rows[0] || null;
        targetChargeId = targetCharge?.id || null;
      }

      if (targetCharge) {
        const currentBalance = Number(targetCharge.balance_due ?? targetCharge.amount);
        if (Number(data.amount) > currentBalance) return { exceedsBalance: true, remainingBalance: currentBalance };
      }

      const paymentRes = await client.query(
        `INSERT INTO financial_payments (property_id, charge_id, amount, payment_method, reference, receipt_url, status, received_by_name, payer_name, notes, paid_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'APPROVED', $7, $8, $9, NOW()) RETURNING *`,
        [propertyId, targetChargeId, data.amount, data.paymentMethod || data.payment_method || 'CASH', folio, data.receiptUrl || data.receipt_url || null, data.receivedByName || data.received_by_name || 'Administración', data.payerName || data.payer_name || null, data.notes || null],
      );

      if (targetCharge) {
        const newBalance = Math.max(0, Number(targetCharge.balance_due ?? targetCharge.amount) - Number(data.amount));
        await client.query(
          `UPDATE financial_charges SET balance_due = $1, status = $2, updated_at = NOW() WHERE id = $3`,
          [newBalance, newBalance <= 0.01 ? 'PAID' : 'PARTIAL', targetCharge.id],
        );
      }

      const overdueRes = await client.query(
        `SELECT COUNT(*)::int AS overdue_count FROM financial_charges WHERE property_id = $1 AND due_date < CURRENT_DATE AND status IN ('PENDING', 'PARTIAL')`,
        [propertyId],
      );
      const overdueCount = overdueRes.rows[0]?.overdue_count || 0;
      await client.query(`UPDATE properties SET is_delinquent = $1, updated_at = NOW() WHERE id = $2`, [overdueCount > 0, propertyId]);

      return {
        payment: paymentRes.rows[0],
        updatedChargeId: targetChargeId,
        propertyAddress: `${property.street} #${property.exterior_number}`,
        isDelinquent: overdueCount > 0,
        remainingOverdueCharges: overdueCount,
      };
    });
  }

  async findAllPayments(slug: string, filters: QueryPaymentsDto) {
    let query = `
      SELECT 
        p.id, p.property_id, p.charge_id, p.amount, p.payment_method, p.reference, 
        p.receipt_url, p.status, p.received_by_name, p.payer_name, p.notes, 
        p.gateway_provider, p.gateway_tx_id, p.paid_at, p.created_at,
        prop.street, prop.exterior_number, prop.interior_number,
        c.concept as charge_concept
      FROM financial_payments p
      JOIN properties prop ON p.property_id = prop.id
      LEFT JOIN financial_charges c ON p.charge_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (filters.propertyId) {
      query += ` AND p.property_id = $${idx++}`;
      params.push(filters.propertyId);
    }
    if (filters.paymentMethod) {
      query += ` AND p.payment_method = $${idx++}`;
      params.push(filters.paymentMethod);
    }
    if (filters.status) {
      query += ` AND p.status = $${idx++}`;
      params.push(filters.status);
    }

    query += ` ORDER BY p.paid_at DESC, p.created_at DESC`;

    const res = await this.db.queryTenant(slug, query, params);
    return res.rows;
  }

  async submitSpeiPayment(slug: string, data: SubmitSpeiPaymentDto) {
    const propertyRes = await this.db.queryTenant(
      slug,
      `SELECT id, street, exterior_number FROM properties WHERE id = $1`,
      [data.propertyId],
    );
    const property = propertyRes.rows[0];
    if (!property) return null;

    if (data.chargeId) {
      const charge = await this.findChargeById(slug, data.chargeId);
      if (!charge || charge.property_id !== data.propertyId) return { invalidCharge: true };
    }

    const duplicateRes = await this.db.queryTenant(
      slug,
      `SELECT id FROM financial_payments WHERE reference = $1 LIMIT 1`,
      [data.reference.trim()],
    );
    if (duplicateRes.rows.length > 0) return { duplicateReference: true };

    const paymentRes = await this.db.queryTenant(
      slug,
      `INSERT INTO financial_payments (
        property_id, charge_id, amount, payment_method, reference, receipt_url,
        status, payer_name, notes, paid_at
      ) VALUES ($1, $2, $3, 'SPEI_TRANSFER', $4, $5, 'PENDING_APPROVAL', $6, $7, NOW())
      RETURNING *`,
      [
        data.propertyId,
        data.chargeId || null,
        data.amount,
        data.reference.trim(),
        data.receiptUrl,
        data.payerName || null,
        data.notes || null,
      ],
    );

    return {
      payment: paymentRes.rows[0],
      propertyAddress: `${property.street} #${property.exterior_number}`,
    };
  }

  async reviewPayment(slug: string, id: string, status: 'APPROVED' | 'REJECTED', reviewedByName: string, notes?: string) {
    const pendingRes = await this.db.queryTenant(
      slug,
      `SELECT p.*, prop.street, prop.exterior_number
       FROM financial_payments p
       JOIN properties prop ON prop.id = p.property_id
       WHERE p.id = $1 AND p.status = 'PENDING_APPROVAL'`,
      [id],
    );
    const pendingPayment = pendingRes.rows[0];
    if (!pendingPayment) return null;

    if (status === 'REJECTED') {
      const rejectedRes = await this.db.queryTenant(
        slug,
        `UPDATE financial_payments
         SET status = 'REJECTED', received_by_name = $1, notes = COALESCE($2, notes)
         WHERE id = $3 AND status = 'PENDING_APPROVAL'
         RETURNING *`,
        [reviewedByName, notes || null, id],
      );
      return { payment: rejectedRes.rows[0], propertyAddress: `${pendingPayment.street} #${pendingPayment.exterior_number}` };
    }

    let targetChargeId = pendingPayment.charge_id;
    let targetCharge = targetChargeId ? await this.findChargeById(slug, targetChargeId) : null;

    if (targetCharge && targetCharge.property_id !== pendingPayment.property_id) {
      return { invalidCharge: true };
    }

    if (!targetCharge) {
      const chargeRes = await this.db.queryTenant(
        slug,
        `SELECT * FROM financial_charges
         WHERE property_id = $1 AND status IN ('PENDING', 'PARTIAL')
         ORDER BY due_date ASC, created_at ASC LIMIT 1`,
        [pendingPayment.property_id],
      );
      targetCharge = chargeRes.rows[0] || null;
      targetChargeId = targetCharge?.id || null;
    }

    if (targetCharge) {
      const currentBalance = Number(targetCharge.balance_due ?? targetCharge.amount);
      if (Number(pendingPayment.amount) > currentBalance) {
        return { exceedsBalance: true, remainingBalance: currentBalance };
      }
    }

    const approvedRes = await this.db.queryTenant(
      slug,
      `UPDATE financial_payments
       SET status = 'APPROVED', charge_id = $1, received_by_name = $2, notes = COALESCE($3, notes)
       WHERE id = $4 AND status = 'PENDING_APPROVAL'
       RETURNING *`,
      [targetChargeId, reviewedByName, notes || null, id],
    );
    if (approvedRes.rows.length === 0) return null;

    if (targetCharge) {
      const newBalance = Math.max(0, Number(targetCharge.balance_due ?? targetCharge.amount) - Number(pendingPayment.amount));
      const newStatus = newBalance <= 0.01 ? 'PAID' : 'PARTIAL';
      await this.db.queryTenant(
        slug,
        `UPDATE financial_charges SET balance_due = $1, status = $2, updated_at = NOW() WHERE id = $3`,
        [newBalance, newStatus, targetCharge.id],
      );
    }

    const overdueRes = await this.db.queryTenant(
      slug,
      `SELECT COUNT(*)::int AS overdue_count FROM financial_charges
       WHERE property_id = $1 AND due_date < CURRENT_DATE AND status IN ('PENDING', 'PARTIAL')`,
      [pendingPayment.property_id],
    );
    const overdueCount = overdueRes.rows[0]?.overdue_count || 0;
    await this.db.queryTenant(
      slug,
      `UPDATE properties SET is_delinquent = $1, updated_at = NOW() WHERE id = $2`,
      [overdueCount > 0, pendingPayment.property_id],
    );

    return {
      payment: approvedRes.rows[0],
      updatedChargeId: targetChargeId,
      propertyAddress: `${pendingPayment.street} #${pendingPayment.exterior_number}`,
      isDelinquent: overdueCount > 0,
    };
  }

  async getPropertyFinancialStatus(slug: string, propertyId: string) {
    const chargesRes = await this.db.queryTenant(
      slug,
      `SELECT * FROM financial_charges WHERE property_id = $1 ORDER BY due_date DESC`,
      [propertyId],
    );
    const paymentsRes = await this.db.queryTenant(
      slug,
      `SELECT * FROM financial_payments WHERE property_id = $1 AND status = 'APPROVED' ORDER BY paid_at DESC LIMIT 10`,
      [propertyId],
    );

    const pendingCharges = chargesRes.rows.filter(
      (c) => c.status === 'PENDING' || c.status === 'PARTIAL',
    );
    const totalBalanceDue = pendingCharges.reduce(
      (acc, c) => acc + Number(c.balance_due ?? c.amount),
      0,
    );
    const totalCharged = chargesRes.rows.reduce((acc, charge) => acc + Number(charge.amount || 0), 0);
    const totalPaidRes = await this.db.queryTenant(
      slug,
      `SELECT COALESCE(SUM(amount), 0)::numeric(12,2) AS total_paid
       FROM financial_payments
       WHERE property_id = $1 AND status = 'APPROVED'`,
      [propertyId],
    );
    const totalPaid = Number(totalPaidRes.rows[0]?.total_paid || 0);
    const unallocatedCreditRes = await this.db.queryTenant(
      slug,
      `SELECT COALESCE(SUM(amount), 0)::numeric(12,2) AS credit_balance
       FROM financial_payments
       WHERE property_id = $1 AND charge_id IS NULL AND status = 'APPROVED'`,
      [propertyId],
    );
    const creditBalance = Number(unallocatedCreditRes.rows[0]?.credit_balance || 0);
    const accountStatus = creditBalance > 0
      ? 'CREDIT_BALANCE'
      : totalBalanceDue > 0
        ? 'OVERDUE'
        : 'UP_TO_DATE';

    return {
      propertyId,
      totalBalanceDue: Math.round(totalBalanceDue * 100) / 100,
      totalCharged: Math.round(totalCharged * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      creditBalance: Math.round(creditBalance * 100) / 100,
      accountStatus,
      hasPendingCharges: pendingCharges.length > 0,
      pendingChargesCount: pendingCharges.length,
      charges: chargesRes.rows,
      recentPayments: paymentsRes.rows,
    };
  }

  async getFinancialSummary(slug: string) {
    // Total collected this current month
    const collectedRes = await this.db.queryTenant(
      slug,
      `SELECT 
        COALESCE(SUM(amount), 0)::numeric(12,2) as total_collected_month,
        COUNT(*)::int as payments_count,
        COALESCE(SUM(amount) FILTER (WHERE payment_method = 'CASH'), 0)::numeric(12,2) as cash_collected,
        COALESCE(SUM(amount) FILTER (WHERE payment_method IN ('SPEI_TRANSFER', 'BANK_DEPOSIT', 'MANUAL_TRANSFER')), 0)::numeric(12,2) as spei_collected
       FROM financial_payments 
       WHERE EXTRACT(MONTH FROM paid_at) = EXTRACT(MONTH FROM CURRENT_DATE) 
         AND EXTRACT(YEAR FROM paid_at) = EXTRACT(YEAR FROM CURRENT_DATE)
         AND status = 'APPROVED'`,
    );

    // Pending and overdue charges
    const pendingRes = await this.db.queryTenant(
      slug,
      `SELECT 
        COALESCE(SUM(balance_due), 0)::numeric(12,2) as total_pending_amount,
        COALESCE(SUM(balance_due) FILTER (WHERE due_date < CURRENT_DATE), 0)::numeric(12,2) as total_overdue_amount,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status IN ('PENDING', 'PARTIAL'))::int as overdue_charges_count
       FROM financial_charges 
       WHERE status IN ('PENDING', 'PARTIAL')`,
    );

    // Property status counts
    const propsRes = await this.db.queryTenant(
      slug,
      `SELECT 
        COUNT(*)::int as total_properties,
        COUNT(*) FILTER (WHERE is_delinquent = true)::int as delinquent_properties_count,
        COUNT(*) FILTER (WHERE is_delinquent = false)::int as up_to_date_properties_count
       FROM properties`,
    );

    return {
      summary: {
        totalCollectedMonth: Number(collectedRes.rows[0]?.total_collected_month || 0),
        paymentsCount: collectedRes.rows[0]?.payments_count || 0,
        cashCollected: Number(collectedRes.rows[0]?.cash_collected || 0),
        speiCollected: Number(collectedRes.rows[0]?.spei_collected || 0),
        totalPendingAmount: Number(pendingRes.rows[0]?.total_pending_amount || 0),
        totalOverdueAmount: Number(pendingRes.rows[0]?.total_overdue_amount || 0),
        overdueChargesCount: pendingRes.rows[0]?.overdue_charges_count || 0,
        totalProperties: propsRes.rows[0]?.total_properties || 0,
        delinquentPropertiesCount: propsRes.rows[0]?.delinquent_properties_count || 0,
        upToDatePropertiesCount: propsRes.rows[0]?.up_to_date_properties_count || 0,
      },
    };
  }
}
