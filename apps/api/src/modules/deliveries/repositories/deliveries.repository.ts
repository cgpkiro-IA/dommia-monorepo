import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class DeliveriesRepository {
  constructor(private readonly db: DatabaseService) {}

  async findRecent(slug: string, status?: 'PENDING' | 'COLLECTED') {
    const result = await this.db.queryTenant(slug, `
      SELECT id, recipient_name, property_address, carrier, tracking_code, notes, status,
             received_by, received_at, collected_by, collected_by_name, collected_at
      FROM guard_deliveries
      ${status ? 'WHERE status = $1' : ''}
      ORDER BY CASE WHEN status = 'PENDING' THEN 0 ELSE 1 END, received_at DESC
      LIMIT 30
    `, status ? [status] : []);
    return result.rows;
  }

  async create(slug: string, guardId: string, data: {
    recipientName: string;
    propertyAddress: string;
    carrier: string;
    trackingCode?: string;
    notes?: string;
  }) {
    const result = await this.db.queryTenant(slug, `
      INSERT INTO guard_deliveries (recipient_name, property_address, carrier, tracking_code, notes, received_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      data.recipientName.trim(),
      data.propertyAddress.trim(),
      data.carrier.trim(),
      data.trackingCode?.trim() || null,
      data.notes?.trim() || null,
      guardId,
    ]);
    return result.rows[0];
  }

  async collect(slug: string, id: string, guardId: string, collectedByName: string) {
    const result = await this.db.queryTenant(slug, `
      UPDATE guard_deliveries
      SET status = 'COLLECTED', collected_by = $2, collected_by_name = $3, collected_at = NOW()
      WHERE id = $1 AND status = 'PENDING'
      RETURNING *
    `, [id, guardId, collectedByName.trim()]);
    return result.rows[0] || null;
  }
}