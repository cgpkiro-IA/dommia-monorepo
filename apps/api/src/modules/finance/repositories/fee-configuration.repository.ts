import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { CreateFeeConfigurationDto, UpdateFeeConfigurationDto } from '../dto/fee-configuration.dto';

@Injectable()
export class FeeConfigurationRepository {
  constructor(private readonly db: DatabaseService) {}

  async ensureTableExists(slug: string): Promise<void> {
    const ddl = `
      CREATE TABLE IF NOT EXISTS fee_configurations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(150) NOT NULL,
        fee_type VARCHAR(32) NOT NULL DEFAULT 'FIXED_RECURRENT',
        base_amount NUMERIC(12,2) NOT NULL,
        frequency VARCHAR(32) NOT NULL DEFAULT 'MONTHLY',
        due_day INT NOT NULL DEFAULT 10,
        grace_days INT NOT NULL DEFAULT 5,
        late_fee_type VARCHAR(32) NOT NULL DEFAULT 'PERCENTAGE',
        late_fee_amount NUMERIC(12,2) NOT NULL DEFAULT 10.00,
        early_bird_discount_type VARCHAR(32) NOT NULL DEFAULT 'NONE',
        early_bird_discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        early_bird_deadline_day INT DEFAULT 5,
        applies_to_all_properties BOOLEAN NOT NULL DEFAULT true,
        is_active BOOLEAN NOT NULL DEFAULT true,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await this.db.queryTenant(slug, ddl);
  }

  async findAllByTenant(slug: string, activeOnly: boolean = false) {
    await this.ensureTableExists(slug);

    let query = `
      SELECT 
        id, 
        name, 
        fee_type, 
        fee_type as "feeType",
        base_amount, 
        base_amount as "baseAmount",
        frequency, 
        due_day, 
        due_day as "dueDay",
        grace_days, 
        grace_days as "graceDays",
        late_fee_type, 
        late_fee_type as "lateFeeType",
        late_fee_amount, 
        late_fee_amount as "lateFeeAmount",
        early_bird_discount_type, 
        early_bird_discount_type as "earlyBirdDiscountType",
        early_bird_discount_amount, 
        early_bird_discount_amount as "earlyBirdDiscountAmount",
        early_bird_deadline_day, 
        early_bird_deadline_day as "earlyBirdDeadlineDay",
        applies_to_all_properties, 
        applies_to_all_properties as "appliesToAllProperties",
        is_active, 
        is_active as "isActive",
        description, 
        created_at, 
        created_at as "createdAt",
        updated_at,
        updated_at as "updatedAt"
      FROM fee_configurations
    `;
    const params: any[] = [];

    if (activeOnly) {
      query += ` WHERE is_active = true`;
    }

    query += ` ORDER BY is_active DESC, fee_type ASC, name ASC`;

    const res = await this.db.queryTenant(slug, query, params);
    return res.rows;
  }

  async findById(slug: string, id: string) {
    await this.ensureTableExists(slug);

    const query = `
      SELECT 
        id, 
        name, 
        fee_type, 
        fee_type as "feeType",
        base_amount, 
        base_amount as "baseAmount",
        frequency, 
        due_day, 
        due_day as "dueDay",
        grace_days, 
        grace_days as "graceDays",
        late_fee_type, 
        late_fee_type as "lateFeeType",
        late_fee_amount, 
        late_fee_amount as "lateFeeAmount",
        early_bird_discount_type, 
        early_bird_discount_type as "earlyBirdDiscountType",
        early_bird_discount_amount, 
        early_bird_discount_amount as "earlyBirdDiscountAmount",
        early_bird_deadline_day, 
        early_bird_deadline_day as "earlyBirdDeadlineDay",
        applies_to_all_properties, 
        applies_to_all_properties as "appliesToAllProperties",
        is_active, 
        is_active as "isActive",
        description, 
        created_at, 
        created_at as "createdAt",
        updated_at,
        updated_at as "updatedAt"
      FROM fee_configurations
      WHERE id = $1
    `;
    const res = await this.db.queryTenant(slug, query, [id]);
    return res.rows[0] || null;
  }

  async create(slug: string, dto: CreateFeeConfigurationDto) {
    await this.ensureTableExists(slug);

    const query = `
      INSERT INTO fee_configurations (
        name, fee_type, base_amount, frequency, due_day, grace_days,
        late_fee_type, late_fee_amount, early_bird_discount_type, early_bird_discount_amount, early_bird_deadline_day,
        applies_to_all_properties, is_active, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING 
        id, name, fee_type, fee_type as "feeType", base_amount, base_amount as "baseAmount",
        frequency, due_day, due_day as "dueDay", grace_days, grace_days as "graceDays",
        late_fee_type, late_fee_type as "lateFeeType", late_fee_amount, late_fee_amount as "lateFeeAmount",
        early_bird_discount_type, early_bird_discount_type as "earlyBirdDiscountType",
        early_bird_discount_amount, early_bird_discount_amount as "earlyBirdDiscountAmount",
        early_bird_deadline_day, early_bird_deadline_day as "earlyBirdDeadlineDay",
        applies_to_all_properties, applies_to_all_properties as "appliesToAllProperties",
        is_active, is_active as "isActive", description, created_at, created_at as "createdAt"
    `;

    const values = [
      dto.name,
      dto.feeType,
      dto.baseAmount,
      dto.frequency || 'MONTHLY',
      dto.dueDay || 10,
      dto.graceDays ?? 5,
      dto.lateFeeType || 'PERCENTAGE',
      dto.lateFeeAmount ?? 10.0,
      dto.earlyBirdDiscountType || 'NONE',
      dto.earlyBirdDiscountAmount ?? 0.0,
      dto.earlyBirdDeadlineDay || null,
      dto.appliesToAllProperties ?? true,
      dto.isActive ?? true,
      dto.description || null,
    ];

    const res = await this.db.queryTenant(slug, query, values);
    return res.rows[0];
  }

  async update(slug: string, id: string, dto: UpdateFeeConfigurationDto) {
    await this.ensureTableExists(slug);

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (dto.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(dto.name);
    }
    if (dto.feeType !== undefined) {
      fields.push(`fee_type = $${idx++}`);
      values.push(dto.feeType);
    }
    if (dto.baseAmount !== undefined) {
      fields.push(`base_amount = $${idx++}`);
      values.push(dto.baseAmount);
    }
    if (dto.frequency !== undefined) {
      fields.push(`frequency = $${idx++}`);
      values.push(dto.frequency);
    }
    if (dto.dueDay !== undefined) {
      fields.push(`due_day = $${idx++}`);
      values.push(dto.dueDay);
    }
    if (dto.graceDays !== undefined) {
      fields.push(`grace_days = $${idx++}`);
      values.push(dto.graceDays);
    }
    if (dto.lateFeeType !== undefined) {
      fields.push(`late_fee_type = $${idx++}`);
      values.push(dto.lateFeeType);
    }
    if (dto.lateFeeAmount !== undefined) {
      fields.push(`late_fee_amount = $${idx++}`);
      values.push(dto.lateFeeAmount);
    }
    if (dto.earlyBirdDiscountType !== undefined) {
      fields.push(`early_bird_discount_type = $${idx++}`);
      values.push(dto.earlyBirdDiscountType);
    }
    if (dto.earlyBirdDiscountAmount !== undefined) {
      fields.push(`early_bird_discount_amount = $${idx++}`);
      values.push(dto.earlyBirdDiscountAmount);
    }
    if (dto.earlyBirdDeadlineDay !== undefined) {
      fields.push(`early_bird_deadline_day = $${idx++}`);
      values.push(dto.earlyBirdDeadlineDay);
    }
    if (dto.appliesToAllProperties !== undefined) {
      fields.push(`applies_to_all_properties = $${idx++}`);
      values.push(dto.appliesToAllProperties);
    }
    if (dto.isActive !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(dto.isActive);
    }
    if (dto.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(dto.description);
    }

    if (fields.length === 0) {
      return this.findById(slug, id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE fee_configurations
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;

    const res = await this.db.queryTenant(slug, query, values);
    return res.rows[0] ? this.findById(slug, id) : null;
  }

  async delete(slug: string, id: string) {
    await this.ensureTableExists(slug);
    const query = `DELETE FROM fee_configurations WHERE id = $1 RETURNING id`;
    const res = await this.db.queryTenant(slug, query, [id]);
    return res.rowCount ? res.rowCount > 0 : false;
  }

  async getPropertiesForSimulation(slug: string) {
    const query = `
      SELECT 
        id, 
        street, 
        exterior_number, 
        interior_number, 
        block, 
        lot,
        COALESCE(lot_size_m2, 150.00) as lot_size_m2,
        COALESCE(building_size_m2, 180.00) as building_size_m2,
        is_delinquent
      FROM properties
      ORDER BY street ASC, exterior_number ASC
    `;
    const res = await this.db.queryTenant(slug, query);
    return res.rows;
  }
}
