import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { CreateGuardIncidentDto, CreateVehicleFlagDto, GuardHistoryQueryDto } from '../dto/guard-operations.dto';

@Injectable()
export class GuardOperationsRepository {
  constructor(private readonly db: DatabaseService) {}

  async createIncident(slug: string, actorId: string, dto: CreateGuardIncidentDto) {
    const result = await this.db.queryTenant(slug, `
      INSERT INTO guard_incidents (incident_type, priority, description, property_address, vehicle_plates, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [dto.type, dto.priority, dto.description.trim(), dto.propertyAddress?.trim() || null, dto.vehiclePlates?.trim().toUpperCase() || null, actorId]);
    return result.rows[0];
  }

  async listIncidents(slug: string, status?: 'OPEN' | 'RESOLVED') {
    const result = await this.db.queryTenant(slug, `
      SELECT i.*, concat_ws(' ', created_user.first_name, created_user.last_name) AS created_by_name,
             concat_ws(' ', resolved_user.first_name, resolved_user.last_name) AS resolved_by_name
      FROM guard_incidents i
      LEFT JOIN public.users created_user ON created_user.id = i.created_by
      LEFT JOIN public.users resolved_user ON resolved_user.id = i.resolved_by
      ${status ? 'WHERE i.status = $1' : ''}
      ORDER BY CASE i.priority WHEN 'URGENT' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END,
               i.created_at DESC
      LIMIT 100
    `, status ? [status] : []);
    return result.rows;
  }

  async resolveIncident(slug: string, id: string, actorId: string) {
    const result = await this.db.queryTenant(slug, `
      UPDATE guard_incidents
      SET status = 'RESOLVED', resolved_by = $2, resolved_at = NOW()
      WHERE id = $1 AND status = 'OPEN'
      RETURNING *
    `, [id, actorId]);
    return result.rows[0] || null;
  }

  async listVehicleFlags(slug: string) {
    const result = await this.db.queryTenant(slug, `
      SELECT id, plates, flag_type, reason, created_at
      FROM guard_vehicle_flags
      WHERE is_active = TRUE
      ORDER BY flag_type, plates
    `);
    return result.rows;
  }

  async createVehicleFlag(slug: string, actorId: string, dto: CreateVehicleFlagDto) {
    const plates = dto.plates.trim().toUpperCase();
    const normalized = plates.replace(/[^A-Z0-9]/g, '');
    const result = await this.db.queryTenant(slug, `
      INSERT INTO guard_vehicle_flags (plates, normalized_plates, flag_type, reason, created_by, is_active, removed_by, removed_at)
      VALUES ($1, $2, $3, $4, $5, TRUE, NULL, NULL)
      ON CONFLICT (normalized_plates) DO UPDATE
      SET plates = EXCLUDED.plates, flag_type = EXCLUDED.flag_type, reason = EXCLUDED.reason,
          created_by = EXCLUDED.created_by, created_at = NOW(), is_active = TRUE, removed_by = NULL, removed_at = NULL
      RETURNING id, plates, flag_type, reason, created_at
    `, [plates, normalized, dto.flagType, dto.reason.trim(), actorId]);
    return result.rows[0];
  }

  async removeVehicleFlag(slug: string, id: string, actorId: string) {
    const result = await this.db.queryTenant(slug, `
      UPDATE guard_vehicle_flags
      SET is_active = FALSE, removed_by = $2, removed_at = NOW()
      WHERE id = $1 AND is_active = TRUE
      RETURNING id, plates
    `, [id, actorId]);
    return result.rows[0] || null;
  }

  async history(slug: string, filters: GuardHistoryQueryDto) {
    const result = await this.db.queryTenant(slug, `
      WITH events AS (
        SELECT al.id::text AS id, 'ACCESS'::text AS type,
               CASE
                 WHEN al.access_type = 'MANUAL_GUARD' AND al.manual_reason ILIKE '%AUTORIZADA_POR_LLAMADA%' THEN 'Acceso manual autorizado por llamada'
                 WHEN al.access_type = 'MANUAL_GUARD' THEN 'Acceso manual'
                 WHEN al.is_granted THEN 'Acceso autorizado'
                 ELSE 'Acceso denegado'
               END AS title,
               COALESCE(al.manual_reason, al.rejection_reason, al.access_type) AS details,
               al.property_id, CASE WHEN p.id IS NULL THEN NULL ELSE concat_ws(' ', p.street, p.exterior_number, p.interior_number, p.block, p.lot) END AS property_address,
               al.guard_user_id AS actor_id, concat_ws(' ', u.first_name, u.last_name) AS actor_name, al.timestamp AS occurred_at
        FROM access_logs al
        LEFT JOIN properties p ON p.id = al.property_id
        LEFT JOIN public.users u ON u.id = al.guard_user_id
        UNION ALL
        SELECT d.id::text, 'DELIVERY_RECEIVED'::text, 'Paquete recibido'::text,
               concat_ws(' · ', d.recipient_name, d.carrier, d.tracking_code), NULL::uuid, d.property_address,
               d.received_by, concat_ws(' ', u.first_name, u.last_name), d.received_at
        FROM guard_deliveries d
        LEFT JOIN public.users u ON u.id = d.received_by
        UNION ALL
        SELECT d.id::text, 'DELIVERY_COLLECTED'::text, 'Paquete retirado'::text,
               concat_ws(' · ', d.recipient_name, d.carrier, d.collected_by_name), NULL::uuid, d.property_address,
               d.collected_by, concat_ws(' ', u.first_name, u.last_name), d.collected_at
        FROM guard_deliveries d
        LEFT JOIN public.users u ON u.id = d.collected_by
        WHERE d.collected_at IS NOT NULL
        UNION ALL
        SELECT i.id::text, 'INCIDENT'::text, concat('Incidencia ', lower(i.priority), ': ', i.incident_type),
               i.description, NULL::uuid, i.property_address, i.created_by,
               concat_ws(' ', u.first_name, u.last_name), i.created_at
        FROM guard_incidents i
        LEFT JOIN public.users u ON u.id = i.created_by
      )
      SELECT * FROM events
      WHERE ($1::text IS NULL OR type = $1)
        AND ($2::text IS NULL OR COALESCE(property_address, '') ILIKE $2)
        AND ($3::timestamptz IS NULL OR occurred_at >= $3::timestamptz)
        AND ($4::timestamptz IS NULL OR occurred_at <= $4::timestamptz)
      ORDER BY occurred_at DESC
      LIMIT $5
    `, [filters.type || null, filters.property?.trim() ? `%${filters.property.trim()}%` : null, filters.from || null, filters.to || null, filters.limit || 50]);
    return result.rows;
  }
}