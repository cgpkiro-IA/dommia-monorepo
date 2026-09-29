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

  async findResidentsByAddress(slug: string, propertyAddress: string) {
    const result = await this.db.queryTenant(slug, `
      SELECT r.id, r.first_name, r.last_name, r.email, r.phone
      FROM residents r
      JOIN properties p ON p.id = r.property_id
      WHERE r.is_active = TRUE
        AND (
          LOWER(TRIM($1)) = LOWER(TRIM(
            CONCAT(
              p.street, ' #', p.exterior_number,
              CASE WHEN p.interior_number IS NOT NULL AND p.interior_number != '' THEN CONCAT(' Int. ', p.interior_number) ELSE '' END,
              CASE WHEN p.block IS NOT NULL AND p.block != '' THEN CONCAT(' ', p.block) ELSE '' END,
              CASE WHEN p.lot IS NOT NULL AND p.lot != '' THEN CONCAT(' Lote ', p.lot) ELSE '' END
            )
          ))
          OR (
            LOWER($1) LIKE LOWER(CONCAT('%', p.street, '%'))
            AND (p.exterior_number IS NULL OR p.exterior_number = '' OR LOWER($1) LIKE LOWER(CONCAT('%', p.exterior_number, '%')))
          )
        )
      LIMIT 10
    `, [propertyAddress.trim()]);
    return result.rows;
  }

  async findPendingForProperty(slug: string, propertyId: string) {
    const result = await this.db.queryTenant(slug, `
      SELECT d.id, d.recipient_name, d.property_address, d.carrier, d.tracking_code, d.notes, d.status,
             d.received_at
      FROM guard_deliveries d
      JOIN properties p ON p.id = $1
      WHERE d.status = 'PENDING'
        AND (
          LOWER(TRIM(d.property_address)) = LOWER(TRIM(
            CONCAT(
              p.street, ' #', p.exterior_number,
              CASE WHEN p.interior_number IS NOT NULL AND p.interior_number != '' THEN CONCAT(' Int. ', p.interior_number) ELSE '' END,
              CASE WHEN p.block IS NOT NULL AND p.block != '' THEN CONCAT(' ', p.block) ELSE '' END,
              CASE WHEN p.lot IS NOT NULL AND p.lot != '' THEN CONCAT(' Lote ', p.lot) ELSE '' END
            )
          ))
          OR (
            LOWER(d.property_address) LIKE LOWER(CONCAT('%', p.street, '%'))
            AND (p.exterior_number IS NULL OR p.exterior_number = '' OR LOWER(d.property_address) LIKE LOWER(CONCAT('%', p.exterior_number, '%')))
          )
        )
      ORDER BY d.received_at DESC
      LIMIT 20
    `, [propertyId]);
    return result.rows;
  }
}