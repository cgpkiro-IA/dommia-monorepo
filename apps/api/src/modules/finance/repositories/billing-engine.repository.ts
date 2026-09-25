import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { CreatePaymentDto, QueryChargesDto, QueryPaymentsDto } from '../dto/financial-operations.dto';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

@Injectable()
export class BillingEngineRepository {
  constructor(private readonly db: DatabaseService) {}

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
            RETURNING *;`,
            [property.id, fee.id, concept, amount, amount, dueDate, year, month],
          );
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

    const propertyRes = await this.db.queryTenant(
      slug,
      `SELECT id, street, exterior_number, is_delinquent FROM properties WHERE id = $1`,
      [propertyId],
    );
    const property = propertyRes.rows[0];
    if (!property) return null;

    // Generate internal folio if not provided
    const now = new Date();
    const folioSuffix = Math.floor(1000 + Math.random() * 9000);
    const folio = data.reference?.trim() || `REC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${folioSuffix}`;

    let targetChargeId = data.chargeId || data.charge_id || null;
    let targetCharge: any = null;

    if (targetChargeId) {
      targetCharge = await this.findChargeById(slug, targetChargeId);
    } else {
      // Find oldest pending charge for this property to allocate payment
      const pendingChargesRes = await this.db.queryTenant(
        slug,
        `SELECT * FROM financial_charges 
         WHERE property_id = $1 AND status IN ('PENDING', 'PARTIAL') 
         ORDER BY due_date ASC, created_at ASC LIMIT 1`,
        [propertyId],
      );
      if (pendingChargesRes.rows.length > 0) {
        targetCharge = pendingChargesRes.rows[0];
        targetChargeId = targetCharge.id;
      }
    }

    // Insert into financial_payments
    const insertPaymentQuery = `
      INSERT INTO financial_payments (
        property_id, charge_id, amount, payment_method, reference, receipt_url, 
        status, received_by_name, payer_name, notes, paid_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'APPROVED', $7, $8, $9, NOW())
      RETURNING *;
    `;

    const paymentRes = await this.db.queryTenant(slug, insertPaymentQuery, [
      propertyId,
      targetChargeId,
      data.amount,
      data.paymentMethod || data.payment_method || 'CASH',
      folio,
      data.receiptUrl || data.receipt_url || null,
      data.receivedByName || data.received_by_name || 'Administración',
      data.payerName || data.payer_name || null,
      data.notes || null,
    ]);
    const payment = paymentRes.rows[0];

    // If linked to a charge, update its balance and status
    if (targetCharge) {
      const currentBalance = Number(targetCharge.balance_due ?? targetCharge.amount);
      const newBalance = Math.max(0, currentBalance - Number(data.amount));
      const newStatus = newBalance <= 0.01 ? 'PAID' : 'PARTIAL';

      await this.db.queryTenant(
        slug,
        `UPDATE financial_charges 
         SET balance_due = $1, status = $2, updated_at = NOW() 
         WHERE id = $3`,
        [newBalance, newStatus, targetCharge.id],
      );
    }

    // Evaluate property delinquency status
    // A property is DELINQUENT if it has any charge with due_date < CURRENT_DATE and status IN ('PENDING', 'PARTIAL')
    const overdueRes = await this.db.queryTenant(
      slug,
      `SELECT COUNT(*)::int as overdue_count 
       FROM financial_charges 
       WHERE property_id = $1 AND due_date < CURRENT_DATE AND status IN ('PENDING', 'PARTIAL')`,
      [data.propertyId],
    );
    const overdueCount = overdueRes.rows[0]?.overdue_count || 0;
    const isNowDelinquent = overdueCount > 0;

    await this.db.queryTenant(
      slug,
      `UPDATE properties SET is_delinquent = $1, updated_at = NOW() WHERE id = $2`,
      [isNowDelinquent, data.propertyId],
    );

    return {
      payment,
      updatedChargeId: targetChargeId,
      propertyAddress: `${property.street} #${property.exterior_number}`,
      isDelinquent: isNowDelinquent,
      remainingOverdueCharges: overdueCount,
    };
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

  async getPropertyFinancialStatus(slug: string, propertyId: string) {
    const chargesRes = await this.db.queryTenant(
      slug,
      `SELECT * FROM financial_charges WHERE property_id = $1 ORDER BY due_date DESC`,
      [propertyId],
    );
    const paymentsRes = await this.db.queryTenant(
      slug,
      `SELECT * FROM financial_payments WHERE property_id = $1 ORDER BY paid_at DESC LIMIT 10`,
      [propertyId],
    );

    const pendingCharges = chargesRes.rows.filter(
      (c) => c.status === 'PENDING' || c.status === 'PARTIAL',
    );
    const totalBalanceDue = pendingCharges.reduce(
      (acc, c) => acc + Number(c.balance_due ?? c.amount),
      0,
    );

    return {
      propertyId,
      totalBalanceDue: Math.round(totalBalanceDue * 100) / 100,
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
