import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { DatabaseService } from '../../../database/database.service';
import {
  CreateGuardServiceDto,
  CreateGuardAccessPointDto,
  CreateGuardUserDto,
  CreateVisitorInvitationDto,
  RegisterServiceExitDto,
  UpdateGuardAccessPointDto,
  UnifiedAuditLogItem,
  UnifiedAuditLogQueryDto,
  UnifiedAuditLogSummary,
} from '../dto/access.dto';

export interface AccessQrPayload {
  app: 'DOMMIA_ACCESS';
  kind: 'VISITOR' | 'RESIDENT';
  tenant: string;
  subjectId: string;
  step: number;
  code: string;
}

export interface ManualOverrideClaims {
  purpose: 'DOMMIA_ACCESS_MANUAL_OVERRIDE';
  tenant: string;
  guardId: string;
  invitationId: string;
  step: number;
  exp: number;
}

export type ManualOverrideResult =
  | { kind: 'INACTIVE' }
  | { kind: 'NOT_VALID' }
  | { kind: 'ALREADY_USED' }
  | { kind: 'QR_ALREADY_USED' }
  | { kind: 'NOT_DELINQUENT' }
  | { kind: 'AUTHORIZED'; invitation: Record<string, any> };

export type ManualVisitAccessResult =
  | { kind: 'NOT_FOUND' }
  | { kind: 'NOT_YET_VALID' }
  | { kind: 'EXPIRED' }
  | { kind: 'INACTIVE' }
  | { kind: 'ALREADY_USED' }
  | { kind: 'AUTHORIZED'; invitation: Record<string, any> };

@Injectable()
export class AccessRepository {
  constructor(private readonly db: DatabaseService) {}

  private async resolveActiveAccessPoint(client: PoolClient, accessPointId?: string) {
    const result = await client.query('SELECT id, name FROM guard_access_points WHERE is_active = TRUE ORDER BY LOWER(name)');
    if (accessPointId) {
      const accessPoint = result.rows.find((row) => row.id === accessPointId);
      if (!accessPoint) throw new NotFoundException('La caseta o acceso seleccionado no existe o está inactivo.');
      return accessPoint;
    }
    if (result.rows.length === 1) return result.rows[0];
    if (result.rows.length === 0) throw new BadRequestException('La comunidad no tiene casetas o accesos activos configurados.');
    throw new BadRequestException('Selecciona la caseta o acceso donde se registra la operación.');
  }

  async listAccessPoints(slug: string, activeOnly = false) {
    const result = await this.db.queryTenant(slug, `
      SELECT id, name, is_active, created_at, updated_at
      FROM guard_access_points
      WHERE $1::boolean = FALSE OR is_active = TRUE
      ORDER BY LOWER(name)
    `, [activeOnly]);
    return result.rows;
  }

  async createAccessPoint(slug: string, dto: CreateGuardAccessPointDto) {
    try {
      const result = await this.db.queryTenant(slug, `
        INSERT INTO guard_access_points (name)
        VALUES ($1)
        RETURNING id, name, is_active, created_at, updated_at
      `, [dto.name.trim()]);
      return result.rows[0];
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw new ConflictException('Ya existe una caseta o acceso con ese nombre.');
      throw error;
    }
  }

  async updateAccessPoint(slug: string, id: string, dto: UpdateGuardAccessPointDto) {
    try {
      return await this.db.withTenantTransaction(slug, async (client) => {
        const currentResult = await client.query('SELECT id, is_active FROM guard_access_points WHERE id = $1 FOR UPDATE', [id]);
        const current = currentResult.rows[0];
        if (!current) return null;

        if (dto.isActive === false && current.is_active) {
          const activeResult = await client.query('SELECT id FROM guard_access_points WHERE is_active = TRUE FOR UPDATE');
          if (activeResult.rowCount <= 1) throw new BadRequestException('La comunidad debe conservar al menos una caseta o acceso activo.');
        }

        const result = await client.query(`
          UPDATE guard_access_points
          SET name = COALESCE($2, name),
              is_active = COALESCE($3, is_active),
              updated_at = NOW()
          WHERE id = $1
          RETURNING id, name, is_active, created_at, updated_at
        `, [id, dto.name?.trim() || null, dto.isActive ?? null]);
        return result.rows[0] || null;
      });
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw new ConflictException('Ya existe una caseta o acceso con ese nombre.');
      throw error;
    }
  }

  async listGuards(slug: string) {
    const result = await this.db.query(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, u.created_at
      FROM public.user_tenants ut
      JOIN public.users u ON u.id = ut.user_id
      JOIN public.tenants t ON t.id = ut.tenant_id
      WHERE LOWER(t.slug) = LOWER($1) AND ut.role = 'GUARD' AND u.is_active = TRUE
      ORDER BY u.created_at DESC
    `, [slug]);
    return result.rows;
  }

  async createGuard(tenantId: string, dto: CreateGuardUserDto) {
    const result = await this.db.query(`
      WITH created_user AS (
        INSERT INTO public.users (email, password_hash, first_name, last_name, role, tenant_id, is_active)
        VALUES (LOWER($1), crypt($2, gen_salt('bf', 10)), $3, $4, 'GUARD', $5, TRUE)
        ON CONFLICT (email) DO NOTHING
        RETURNING id, email, first_name, last_name, is_active, created_at
      ), assignment AS (
        INSERT INTO public.user_tenants (user_id, tenant_id, role)
        SELECT created_user.id, $5, 'GUARD'
        FROM created_user
        RETURNING user_id
      )
      SELECT created_user.* FROM created_user
      JOIN assignment ON assignment.user_id = created_user.id
    `, [dto.email.trim().toLowerCase(), dto.password, dto.firstName.trim(), dto.lastName.trim(), tenantId]);
    return result.rows[0] || null;
  }

  async createInvitation(slug: string, residentId: string, propertyId: string, dto: CreateVisitorInvitationDto) {
    const invitationType = dto.passType === 'SINGLE_USE' ? 'SINGLE' : dto.passType === 'TEMPORARY' ? 'RECURRENT' : 'SERVICE';
    const result = await this.db.queryTenant(slug, `
      INSERT INTO invitations (property_id, resident_id, visitor_name, invitation_type, valid_from, valid_until, notes)
      SELECT property_id, id, $3, $4, NOW(), NOW() + ($5::int * INTERVAL '1 day'), $6
      FROM residents
      WHERE id = $1 AND property_id = $2 AND is_active = TRUE
      RETURNING id, visitor_name, invitation_type, valid_from, valid_until, notes, is_active, used_at, created_at
    `, [residentId, propertyId, dto.visitorName.trim(), invitationType, dto.validDays, dto.notes?.trim() || null]);
    return result.rows[0] || null;
  }

  async listInvitations(slug: string, residentId: string) {
    const result = await this.db.queryTenant(slug, `
      SELECT i.id, i.visitor_name, i.invitation_type, i.valid_from, i.valid_until, i.notes,
             i.is_active, i.used_at, i.created_at, COUNT(l.id)::int AS access_count
      FROM invitations i
      LEFT JOIN access_logs l ON l.identifier = i.id::text AND l.is_granted = TRUE
      WHERE i.resident_id = $1
      GROUP BY i.id
      ORDER BY i.created_at DESC
      LIMIT 100
    `, [residentId]);
    return result.rows;
  }

  async revokeInvitation(slug: string, residentId: string, id: string) {
    const result = await this.db.queryTenant(slug, `
      UPDATE invitations SET is_active = FALSE
      WHERE id = $1 AND resident_id = $2 AND is_active = TRUE
      RETURNING id
    `, [id, residentId]);
    return result.rows[0] || null;
  }

  async findGuestPass(slug: string, id: string) {
    const result = await this.db.queryTenant(slug, `
      SELECT i.id, i.visitor_name, i.invitation_type, i.valid_from, i.valid_until, i.notes,
             i.totp_secret, i.created_at, p.street, p.exterior_number, p.interior_number,
             r.first_name, r.last_name
      FROM invitations i
      JOIN properties p ON p.id = i.property_id
      JOIN residents r ON r.id = i.resident_id
      WHERE i.id = $1 AND i.is_active = TRUE AND i.valid_from <= NOW() AND i.valid_until > NOW()
        AND (i.invitation_type <> 'SINGLE' OR i.used_at IS NULL)
    `, [id]);
    return result.rows[0] || null;
  }

  async findResidentCredential(slug: string, residentId: string, propertyId: string) {
    const result = await this.db.queryTenant(slug, `
      SELECT r.id, r.access_totp_secret, r.is_active, p.street, p.exterior_number, p.interior_number
      FROM residents r
      JOIN properties p ON p.id = r.property_id
      WHERE r.id = $1 AND r.property_id = $2
    `, [residentId, propertyId]);
    return result.rows[0] || null;
  }

  async validateAccess(
    slug: string,
    operatorId: string,
    payload: AccessQrPayload,
    determineReason: (subject: Record<string, any>, now: number) => string | null,
  ) {
    return this.db.withTenantTransaction(slug, async (client) => {
      const result = payload.kind === 'VISITOR' ? await client.query(`
        SELECT i.id, i.property_id, i.resident_id, i.visitor_name, i.invitation_type,
               i.valid_from, i.valid_until, i.totp_secret, i.is_active, i.used_at,
               i.last_used_step, p.is_delinquent, p.street, p.exterior_number, p.interior_number,
               'VISITOR' AS kind, r.first_name, r.last_name, r.email AS host_email, r.phone AS host_phone
        FROM invitations i
        JOIN properties p ON p.id = i.property_id
        JOIN residents r ON r.id = i.resident_id
        WHERE i.id = $1
        FOR UPDATE OF i
      `, [payload.subjectId]) : await client.query(`
        SELECT r.id, r.property_id, r.id AS resident_id,
               concat_ws(' ', r.first_name, r.last_name) AS visitor_name,
               'RESIDENT' AS invitation_type, r.created_at AS valid_from,
               NULL::timestamptz AS valid_until, r.access_totp_secret AS totp_secret,
               r.is_active, NULL::timestamptz AS used_at,
               r.last_access_used_step AS last_used_step, p.is_delinquent,
               p.street, p.exterior_number, p.interior_number,
               'RESIDENT' AS kind, r.first_name, r.last_name, r.email AS host_email, r.phone AS host_phone
        FROM residents r
        JOIN properties p ON p.id = r.property_id
        WHERE r.id = $1
        FOR UPDATE OF r
      `, [payload.subjectId]);
      const subject = result.rows[0];
      if (!subject) return { authorized: false, reason: 'PASS_NOT_FOUND' as const, subject: null };

      const now = Date.now();
      const reason = determineReason(subject, now);
      const authorized = reason === null;
      await client.query(`
        INSERT INTO access_logs (access_type, identifier, property_id, is_granted, rejection_reason, guard_user_id)
        VALUES ('DYNAMIC_QR', $1, $2, $3, $4, $5)
      `, [subject.id, subject.property_id, authorized, reason, operatorId]);

      if (authorized && payload.kind === 'VISITOR') {
        await client.query(`
          UPDATE invitations
          SET last_used_step = $2,
              used_at = NOW(),
              is_active = CASE WHEN invitation_type = 'SINGLE' THEN FALSE ELSE is_active END
          WHERE id = $1
        `, [subject.id, payload.step]);
      } else if (authorized) {
        await client.query('UPDATE residents SET last_access_used_step = $2 WHERE id = $1', [subject.id, payload.step]);
      }

      return { authorized, reason: reason || undefined, subject };
    });
  }

  async findGuardContext(slug: string, token: string, platesToken: string, includeFlagMatches: boolean) {
    const [residents, vehicles, flags] = await Promise.all([
      this.db.queryTenant(slug, `
        SELECT r.id, r.property_id, r.first_name, r.last_name, r.email, r.phone, r.role, r.is_primary, r.is_active,
               p.street, p.exterior_number, p.interior_number, p.block, p.lot, p.is_delinquent,
               COALESCE((
                 SELECT json_agg(json_build_object(
                   'id', i.id, 'visitorName', i.visitor_name, 'passType', i.invitation_type,
                   'validFrom', i.valid_from, 'validUntil', i.valid_until, 'notes', i.notes,
                   'usedAt', i.used_at,
                   'status', CASE 
                     WHEN i.invitation_type = 'SINGLE' AND i.used_at IS NOT NULL THEN 'USED'
                     WHEN NOT i.is_active AND i.used_at IS NOT NULL THEN 'USED'
                     WHEN NOT i.is_active THEN 'REVOKED'
                     WHEN i.valid_until <= NOW() THEN 'EXPIRED'
                     ELSE 'ACTIVE'
                   END
                 ) ORDER BY i.created_at DESC)
                 FROM (
                   SELECT * FROM invitations
                   WHERE resident_id = r.id
                     AND (
                       (is_active = TRUE AND valid_until > NOW() AND (invitation_type <> 'SINGLE' OR used_at IS NULL))
                       OR used_at >= NOW() - INTERVAL '7 days'
                       OR (valid_until <= NOW() AND valid_until >= NOW() - INTERVAL '7 days')
                     )
                   ORDER BY created_at DESC
                   LIMIT 10
                 ) i
               ), '[]'::json) AS active_passes
        FROM residents r
        JOIN properties p ON p.id = r.property_id
        WHERE r.is_active = TRUE AND (
          LOWER(CONCAT(r.first_name, ' ', r.last_name)) LIKE $1 OR
          LOWER(COALESCE(r.email, '')) LIKE $1 OR LOWER(COALESCE(r.phone, '')) LIKE $1 OR
          LOWER(COALESCE(p.street, '')) LIKE $1 OR LOWER(COALESCE(p.exterior_number, '')) LIKE $1 OR
          LOWER(COALESCE(p.interior_number, '')) LIKE $1 OR LOWER(COALESCE(p.block, '')) LIKE $1 OR
          LOWER(COALESCE(p.lot, '')) LIKE $1
        )
        ORDER BY r.is_primary DESC, r.last_name ASC, r.first_name ASC
        LIMIT 8
      `, [token]),
      this.db.queryTenant(slug, `
        SELECT v.id, v.property_id, v.resident_id, v.plates, v.brand, v.model, v.color,
               p.street, p.exterior_number, p.interior_number, p.block, p.lot, p.is_delinquent,
               r.first_name AS resident_first_name, r.last_name AS resident_last_name, r.role AS resident_role,
               flags.flag_type, flags.reason AS flag_reason
        FROM vehicles v
        JOIN properties p ON p.id = v.property_id
        LEFT JOIN residents r ON r.id = v.resident_id
        LEFT JOIN guard_vehicle_flags flags ON flags.normalized_plates = regexp_replace(UPPER(v.plates), '[^A-Z0-9]', '', 'g') AND flags.is_active = TRUE
        WHERE regexp_replace(UPPER(v.plates), '[^A-Z0-9]', '', 'g') LIKE $1 OR
          LOWER(CONCAT(COALESCE(r.first_name, ''), ' ', COALESCE(r.last_name, ''))) LIKE $2 OR
          LOWER(COALESCE(p.street, '')) LIKE $2 OR LOWER(COALESCE(p.exterior_number, '')) LIKE $2 OR
          LOWER(COALESCE(p.interior_number, '')) LIKE $2 OR LOWER(COALESCE(p.block, '')) LIKE $2 OR
          LOWER(COALESCE(p.lot, '')) LIKE $2
        ORDER BY v.plates ASC
        LIMIT 8
      `, [platesToken, token]),
      includeFlagMatches
        ? this.db.queryTenant(slug, `
            SELECT id, plates, flag_type, reason FROM guard_vehicle_flags
            WHERE is_active = TRUE AND normalized_plates LIKE $1
            ORDER BY plates LIMIT 8
          `, [platesToken])
        : Promise.resolve({ rows: [] } as any),
    ]);
    return { residents: residents.rows, vehicles: vehicles.rows, flags: flags.rows };
  }

  async findManualVisitCandidates(slug: string, queryToken: string) {
    const result = await this.db.queryTenant(slug, `
      SELECT i.id, i.visitor_name, i.invitation_type, i.valid_from, i.valid_until, i.notes,
             i.used_at, p.id AS property_id, p.street, p.exterior_number, p.interior_number,
             p.block, p.lot, r.id AS resident_id,
             concat_ws(' ', r.first_name, r.last_name) AS host_name, r.phone AS host_phone
      FROM invitations i
      JOIN properties p ON p.id = i.property_id
      JOIN residents r ON r.id = i.resident_id
      WHERE i.is_active = TRUE AND r.is_active = TRUE AND i.valid_until > NOW()
        AND (i.invitation_type <> 'SINGLE' OR i.used_at IS NULL)
        AND (
          i.visitor_name ILIKE $1 OR
          concat_ws(' ', r.first_name, r.last_name) ILIKE $1 OR
          p.street ILIKE $1 OR p.exterior_number ILIKE $1 OR
          COALESCE(p.interior_number, '') ILIKE $1 OR COALESCE(p.block, '') ILIKE $1 OR
          COALESCE(p.lot, '') ILIKE $1 OR
          concat_ws(' ', p.street, p.exterior_number, p.interior_number, p.block, p.lot) ILIKE $1
        )
      ORDER BY CASE WHEN i.valid_from <= NOW() THEN 0 ELSE 1 END, i.valid_from ASC
      LIMIT 20
    `, [queryToken]);
    return result.rows;
  }

  async findManualVisitPropertySuggestions(slug: string, queryToken: string) {
    const result = await this.db.queryTenant(slug, `
      SELECT id, street, exterior_number, interior_number, block, lot
      FROM properties
      WHERE CONCAT_WS(' ', street, exterior_number, interior_number, block, lot) ILIKE $1
         OR street ILIKE $1
         OR exterior_number ILIKE $1
         OR COALESCE(interior_number, '') ILIKE $1
         OR COALESCE(block, '') ILIKE $1
         OR COALESCE(lot, '') ILIKE $1
      ORDER BY LOWER(street), exterior_number, interior_number
      LIMIT 8
    `, [queryToken]);
    return result.rows;
  }

  async authorizeManualVisit(slug: string, invitationId: string, guardId: string): Promise<ManualVisitAccessResult> {
    return this.db.withTenantTransaction(slug, async (client) => {
      const result = await client.query(`
        SELECT i.id, i.property_id, i.resident_id, i.visitor_name, i.invitation_type,
               i.valid_from, i.valid_until, i.is_active, i.used_at,
               p.street, p.exterior_number, p.interior_number, p.block, p.lot,
               concat_ws(' ', r.first_name, r.last_name) AS host_name,
               r.email AS host_email, r.phone AS host_phone
        FROM invitations i
        JOIN properties p ON p.id = i.property_id
        JOIN residents r ON r.id = i.resident_id
        WHERE i.id = $1 AND r.is_active = TRUE
        FOR UPDATE OF i
      `, [invitationId]);
      const invitation = result.rows[0];
      if (!invitation) return { kind: 'NOT_FOUND' };
      if (!invitation.is_active) return { kind: 'INACTIVE' };
      if (new Date(invitation.valid_from).getTime() > Date.now()) return { kind: 'NOT_YET_VALID' };
      if (new Date(invitation.valid_until).getTime() <= Date.now()) return { kind: 'EXPIRED' };
      if (invitation.invitation_type === 'SINGLE' && invitation.used_at) return { kind: 'ALREADY_USED' };

      await client.query(`
        INSERT INTO access_logs (access_type, identifier, property_id, is_granted, rejection_reason, manual_reason, guard_user_id)
        VALUES ('MANUAL_GUARD', $1, $2, TRUE, NULL, $3, $4)
      `, [invitation.id, invitation.property_id, 'VISITA_SIN_QR; INE_VERIFICADA; AUTORIZADA_POR_LLAMADA', guardId]);

      await client.query(`
        UPDATE invitations
        SET used_at = NOW(),
            is_active = CASE WHEN invitation_type = 'SINGLE' THEN FALSE ELSE is_active END
        WHERE id = $1
      `, [invitation.id]);

      return { kind: 'AUTHORIZED', invitation };
    });
  }

  async createManualOverride(slug: string, invitationId: string, step: number, guardId: string, justification: string): Promise<ManualOverrideResult> {
    return this.db.withTenantTransaction(slug, async (client) => {
      const result = await client.query(`
        SELECT i.id, i.property_id, i.visitor_name, i.invitation_type,
               i.valid_from, i.valid_until, i.is_active, i.used_at, i.last_used_step,
               p.is_delinquent, p.street, p.exterior_number, p.interior_number,
               r.first_name, r.last_name, r.email AS host_email, r.phone AS host_phone
        FROM invitations i
        JOIN properties p ON p.id = i.property_id
        JOIN residents r ON r.id = i.resident_id
        WHERE i.id = $1
        FOR UPDATE OF i
      `, [invitationId]);
      const invitation = result.rows[0];
      if (!invitation || !invitation.is_active) return { kind: 'INACTIVE' };
      if (new Date(invitation.valid_from).getTime() > Date.now() || new Date(invitation.valid_until).getTime() <= Date.now()) return { kind: 'NOT_VALID' };
      if (invitation.invitation_type === 'SINGLE' && invitation.used_at) return { kind: 'ALREADY_USED' };
      if (Number(invitation.last_used_step) === step) return { kind: 'QR_ALREADY_USED' };
      if (!invitation.is_delinquent) return { kind: 'NOT_DELINQUENT' };

      await client.query(`
        INSERT INTO access_logs (access_type, identifier, property_id, is_granted, rejection_reason, manual_reason, guard_user_id)
        VALUES ('MANUAL_GUARD', $1, $2, TRUE, NULL, $3, $4)
      `, [invitation.id, invitation.property_id, justification, guardId]);
      await client.query(`
        UPDATE invitations
        SET last_used_step = $2,
            used_at = CASE WHEN invitation_type = 'SINGLE' THEN NOW() ELSE used_at END,
            is_active = CASE WHEN invitation_type = 'SINGLE' THEN FALSE ELSE is_active END
        WHERE id = $1
      `, [invitation.id, step]);
      return { kind: 'AUTHORIZED', invitation };
    });
  }

  async createGuardService(slug: string, guardId: string, dto: CreateGuardServiceDto) {
    const destinationsJson = JSON.stringify(dto.destinations || []);
    const primaryPropertyId = dto.destinations?.[0]?.propertyId || null;
    return this.db.withTenantTransaction(slug, async (client) => {
      const accessPoint = await this.resolveActiveAccessPoint(client, dto.accessPointId);
      const result = await client.query(`
        INSERT INTO guard_services (
          service_type, custom_service_name, supplier_name, vehicle_plates,
          destination_type, destinations, status, notes, entered_by,
          entered_access_point_id, entered_access_point_name, entered_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'IN_TRANSIT', $7, $8, $9, $10, NOW())
        RETURNING id, service_type, custom_service_name, supplier_name, vehicle_plates,
                  destination_type, destinations, status, notes, entered_by,
                  entered_access_point_id, entered_access_point_name, entered_at, exited_by, exited_at
      `, [
        dto.serviceType,
        dto.customServiceName?.trim() || null,
        dto.supplierName?.trim() || null,
        dto.vehiclePlates?.trim().toUpperCase() || null,
        dto.destinationType,
        destinationsJson,
        dto.notes?.trim() || null,
        guardId,
        accessPoint.id,
        accessPoint.name,
      ]);
      const inserted = result.rows[0];
      const actorResult = await client.query(`
        SELECT COALESCE(NULLIF(CONCAT_WS(' ', first_name, last_name), ''), 'Guardia') AS entered_by_name
        FROM public.users WHERE id = $1
      `, [guardId]);
      const created = { ...inserted, entered_by_name: actorResult.rows[0]?.entered_by_name || 'Guardia' };

      let validPropertyId: string | null = null;
      if (primaryPropertyId) {
        const propCheck = await client.query('SELECT id FROM properties WHERE id = $1', [primaryPropertyId]);
        if (propCheck.rows.length > 0) {
          validPropertyId = propCheck.rows[0].id;
        }
      }

      await client.query(`
        INSERT INTO access_logs (access_type, identifier, property_id, is_granted, rejection_reason, manual_reason, guard_user_id)
        VALUES ('SERVICE_ENTRY', $1, $2, TRUE, NULL, $3, $4)
      `, [
        created.id,
        validPropertyId,
        `INGRESO_SERVICIO: ${dto.serviceType}${dto.supplierName ? ` (${dto.supplierName})` : ''} · Acceso: ${accessPoint.name}`,
        guardId,
      ]);

      return created;
    });
  }

  async listGuardServices(slug: string, status?: 'IN_TRANSIT' | 'COMPLETED' | 'ALL') {
    let whereClause = '';
    const params: any[] = [];
    if (status === 'IN_TRANSIT' || !status) {
      whereClause = 'WHERE s.status = $1';
      params.push('IN_TRANSIT');
    } else if (status === 'COMPLETED') {
      whereClause = 'WHERE s.status = $1';
      params.push('COMPLETED');
    }

    const result = await this.db.queryTenant(slug, `
      SELECT s.id, s.service_type, s.custom_service_name, s.supplier_name, s.vehicle_plates,
             s.destination_type, s.destinations, s.status, s.notes, s.entered_by, s.entered_at,
              s.entered_access_point_id, s.entered_access_point_name,
              s.exited_by, s.exited_at, s.exited_access_point_id, s.exited_access_point_name,
              COALESCE(NULLIF(CONCAT_WS(' ', entry_guard.first_name, entry_guard.last_name), ''), 'Guardia') AS entered_by_name,
              COALESCE(NULLIF(CONCAT_WS(' ', exit_guard.first_name, exit_guard.last_name), ''), 'Guardia') AS exited_by_name
      FROM guard_services s
            LEFT JOIN public.users entry_guard ON entry_guard.id = s.entered_by
            LEFT JOIN public.users exit_guard ON exit_guard.id = s.exited_by
      ${whereClause}
      ORDER BY s.entered_at DESC
      LIMIT 100
    `, params);
    return result.rows;
  }

  async registerServiceExit(slug: string, serviceId: string, guardId: string, dto?: RegisterServiceExitDto) {
    return this.db.withTenantTransaction(slug, async (client) => {
      const activeService = await client.query('SELECT id FROM guard_services WHERE id = $1 AND status = $2 FOR UPDATE', [serviceId, 'IN_TRANSIT']);
      if (!activeService.rows[0]) return null;
      const accessPoint = await this.resolveActiveAccessPoint(client, dto?.accessPointId);
      const result = await client.query(`
        UPDATE guard_services
        SET status = 'COMPLETED',
            exited_by = $2,
            exited_access_point_id = $4,
            exited_access_point_name = $5,
            exited_at = NOW(),
            notes = CASE WHEN $3::text IS NOT NULL THEN CONCAT(COALESCE(notes, ''), ' [Salida: ', $3::text, ']') ELSE notes END
        WHERE id = $1 AND status = 'IN_TRANSIT'
        RETURNING id, service_type, custom_service_name, supplier_name, vehicle_plates,
                  destination_type, destinations, status, notes, entered_by,
                  entered_access_point_id, entered_access_point_name, entered_at,
                  exited_by, exited_access_point_id, exited_access_point_name, exited_at
      `, [serviceId, guardId, dto?.notes?.trim() || null, accessPoint.id, accessPoint.name]);
      const exited = result.rows[0] || null;
      if (!exited) return null;
      const actorResult = await client.query(`
        SELECT COALESCE(NULLIF(CONCAT_WS(' ', first_name, last_name), ''), 'Guardia') AS exited_by_name
        FROM public.users WHERE id = $1
      `, [guardId]);
      const updated = { ...exited, exited_by_name: actorResult.rows[0]?.exited_by_name || 'Guardia' };

      await client.query(`
        INSERT INTO access_logs (access_type, identifier, property_id, is_granted, rejection_reason, manual_reason, guard_user_id)
        VALUES ('SERVICE_EXIT', $1, NULL, TRUE, NULL, $2, $3)
      `, [serviceId, `SALIDA_SERVICIO · Acceso: ${accessPoint.name}`, guardId]);

      return updated;
    });
  }

  async listActiveServicesForProperty(slug: string, propertyId: string) {
    const result = await this.db.queryTenant(slug, `
      SELECT s.id, s.service_type, s.custom_service_name, s.supplier_name, s.vehicle_plates,
             s.destination_type, s.destinations, s.status, s.notes, s.entered_at
      FROM guard_services s
      WHERE s.status = 'IN_TRANSIT'
        AND (
          s.destination_type = 'GENERAL'
          OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(s.destinations) elem
            WHERE elem->>'propertyId' = $1
          )
        )
      ORDER BY s.entered_at DESC
      LIMIT 20
    `, [propertyId]);
    return result.rows;
  }

  async listActiveDeliveriesForProperty(slug: string, propertyId: string) {
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

  async findTenantAdminContacts(slug: string) {
    const result = await this.db.query(`
      SELECT u.email, t.contact_phone AS phone, u.first_name, u.last_name
      FROM public.user_tenants ut
      JOIN public.users u ON u.id = ut.user_id
      JOIN public.tenants t ON t.id = ut.tenant_id
      WHERE LOWER(t.slug) = LOWER($1) AND ut.role IN ('TENANT_ADMIN', 'SUPER_ADMIN') AND u.is_active = TRUE
      ORDER BY CASE WHEN ut.role = 'TENANT_ADMIN' THEN 0 ELSE 1 END, u.created_at ASC
      LIMIT 1
    `, [slug]);
    return result.rows[0] || null;
  }

  async getUnifiedAuditLog(slug: string, query: UnifiedAuditLogQueryDto): Promise<{
    summary: UnifiedAuditLogSummary;
    events: UnifiedAuditLogItem[];
  }> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (query.startDate) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(new Date(query.startDate).toISOString());
    }

    if (query.endDate) {
      conditions.push(`created_at <= $${paramIndex++}`);
      // If time not specified, end of day
      const end = new Date(query.endDate);
      if (query.endDate.length <= 10) {
        end.setUTCHours(23, 59, 59, 999);
      }
      params.push(end.toISOString());
    }

    if (query.category && query.category !== 'ALL') {
      conditions.push(`category = $${paramIndex++}`);
      params.push(query.category);
    }

    if (query.status && query.status !== 'ALL') {
      conditions.push(`status = $${paramIndex++}`);
      params.push(query.status);
    }

    if (query.search && query.search.trim().length > 0) {
      const searchToken = `%${query.search.trim()}%`;
      conditions.push(`(
        title ILIKE $${paramIndex} OR
        description ILIKE $${paramIndex} OR
        property_address ILIKE $${paramIndex} OR
        vehicle_plates ILIKE $${paramIndex} OR
        notes ILIKE $${paramIndex} OR
        actor_name ILIKE $${paramIndex}
      )`);
      params.push(searchToken);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = Math.min(Math.max(Number(query.limit) || 100, 1), 500);
    const offset = Math.max(Number(query.offset) || 0, 0);

    const cteSql = `
      WITH combined_events AS (
        -- 1. ACCESS LOGS (QR & MANUAL)
        SELECT 
          l.id::text,
          CASE 
            WHEN l.access_type = 'MANUAL_GUARD' THEN 'ACCESS_MANUAL'
            WHEN l.access_type = 'QR_VISITOR' THEN 'ACCESS_QR_VISITOR'
            WHEN l.access_type = 'QR_RESIDENT' THEN 'ACCESS_QR_RESIDENT'
            ELSE COALESCE(l.access_type, 'ACCESS')
          END AS event_type,
          'ACCESS' AS category,
          CASE 
            WHEN l.access_type = 'MANUAL_GUARD' THEN 'Visita sin QR (Verificación en Caseta)'
            WHEN l.access_type = 'QR_VISITOR' AND l.is_granted THEN 'Acceso Visita con QR'
            WHEN l.access_type = 'QR_VISITOR' AND NOT l.is_granted THEN 'Acceso Denegado (QR Visita)'
            WHEN l.access_type = 'QR_RESIDENT' AND l.is_granted THEN 'Acceso Residente con QR'
            WHEN l.access_type = 'QR_RESIDENT' AND NOT l.is_granted THEN 'Acceso Denegado (QR Residente)'
            ELSE 'Registro de Acceso'
          END AS title,
          COALESCE(
            l.manual_reason,
            CASE WHEN l.is_granted THEN 'Acceso autorizado en caseta' ELSE CONCAT('Rechazado: ', COALESCE(l.rejection_reason, 'No autorizado')) END
          )::text AS description,
          CONCAT_WS(' ', p.street, p.exterior_number, p.interior_number, p.block, p.lot)::text AS property_address,
          NULL::text AS vehicle_plates,
          l.is_granted,
          CASE 
            WHEN l.is_granted THEN 'GRANTED'
            ELSE 'REJECTED'
          END AS status,
          l.rejection_reason::text,
          l.manual_reason::text AS notes,
          CONCAT_WS(' ', u.first_name, u.last_name)::text AS actor_name,
          l.timestamp AS created_at
        FROM access_logs l
        LEFT JOIN properties p ON p.id = l.property_id
        LEFT JOIN public.users u ON u.id = l.guard_user_id
        WHERE l.access_type NOT IN ('SERVICE_ENTRY', 'SERVICE_EXIT')

        UNION ALL

        -- 2. GUARD SERVICES (ENTRY)
        SELECT 
          CONCAT(s.id::text, '-entry') AS id,
          'SERVICE_ENTRY' AS event_type,
          'SERVICE' AS category,
          CONCAT('Ingreso de ', CASE 
            WHEN s.service_type = 'FOOD_DELIVERY' THEN 'Comida / Delivery'
            WHEN s.service_type = 'GAS_SUPPLY' THEN 'Gas L.P. / Pipa'
            WHEN s.service_type = 'WATER_SUPPLY' THEN 'Agua / Garrafones'
            WHEN s.service_type = 'PARCEL_COURIER' THEN 'Paquetería'
            WHEN s.service_type = 'TAXI_RIDE' THEN 'Taxi / App'
            WHEN s.service_type = 'MAINTENANCE' THEN 'Mantenimiento'
            ELSE COALESCE(s.custom_service_name, 'Servicio / Proveedor')
          END)::text AS title,
          CONCAT(COALESCE(s.supplier_name, 'Proveedor'), ' - ', CASE WHEN s.destination_type = 'GENERAL' THEN 'Recorrido General' ELSE 'Destino Residencial' END, ' · Ingresó por: ', COALESCE(s.entered_access_point_name, 'Sin dato previo'))::text AS description,
          CASE 
            WHEN s.destination_type = 'GENERAL' THEN 'Recorrido General por Fraccionamiento'
            ELSE (SELECT string_agg(d->>'propertyAddress', ', ') FROM jsonb_array_elements(s.destinations) d)
          END::text AS property_address,
          s.vehicle_plates::text,
          TRUE AS is_granted,
          s.status::text,
          NULL::text AS rejection_reason,
          s.notes::text,
          COALESCE(CONCAT_WS(' ', u.first_name, u.last_name), s.entered_by::text)::text AS actor_name,
          s.entered_at AS created_at
        FROM guard_services s
        LEFT JOIN public.users u ON u.id = s.entered_by

        UNION ALL

        -- 3. GUARD SERVICES (EXIT)
        SELECT 
          CONCAT(s.id::text, '-exit') AS id,
          'SERVICE_EXIT' AS event_type,
          'SERVICE' AS category,
          CONCAT('Salida de ', CASE 
            WHEN s.service_type = 'FOOD_DELIVERY' THEN 'Comida / Delivery'
            WHEN s.service_type = 'GAS_SUPPLY' THEN 'Gas L.P. / Pipa'
            WHEN s.service_type = 'WATER_SUPPLY' THEN 'Agua / Garrafones'
            WHEN s.service_type = 'PARCEL_COURIER' THEN 'Paquetería'
            WHEN s.service_type = 'TAXI_RIDE' THEN 'Taxi / App'
            WHEN s.service_type = 'MAINTENANCE' THEN 'Mantenimiento'
            ELSE COALESCE(s.custom_service_name, 'Servicio / Proveedor')
          END)::text AS title,
          CONCAT('Salida registrada del proveedor: ', COALESCE(s.supplier_name, ''), ' · Salió por: ', COALESCE(s.exited_access_point_name, 'Sin dato previo'))::text AS description,
          CASE 
            WHEN s.destination_type = 'GENERAL' THEN 'Recorrido General por Fraccionamiento'
            ELSE (SELECT string_agg(d->>'propertyAddress', ', ') FROM jsonb_array_elements(s.destinations) d)
          END::text AS property_address,
          s.vehicle_plates::text,
          TRUE AS is_granted,
          'COMPLETED'::text AS status,
          NULL::text AS rejection_reason,
          s.notes::text,
          COALESCE(CONCAT_WS(' ', u.first_name, u.last_name), s.exited_by::text, 'Guardia')::text AS actor_name,
          s.exited_at AS created_at
        FROM guard_services s
        LEFT JOIN public.users u ON u.id = s.exited_by
        WHERE s.exited_at IS NOT NULL

        UNION ALL

        -- 4. GUARD INCIDENTS
        SELECT 
          i.id::text,
          'INCIDENT'::text AS event_type,
          'INCIDENT' AS category,
          CONCAT('Incidencia: ', i.incident_type)::text AS title,
          i.description::text,
          i.property_address::text,
          i.vehicle_plates::text,
          TRUE AS is_granted,
          i.status::text,
          NULL::text AS rejection_reason,
          CONCAT('Prioridad: ', i.priority)::text AS notes,
          CONCAT_WS(' ', u.first_name, u.last_name)::text AS actor_name,
          i.created_at
        FROM guard_incidents i
        LEFT JOIN public.users u ON u.id = i.created_by

        UNION ALL

        -- 5. GUARD DELIVERIES
        SELECT 
          d.id::text,
          'DELIVERY'::text AS event_type,
          'DELIVERY' AS category,
          CONCAT('Paquetería: ', d.carrier)::text AS title,
          CONCAT('Destinatario: ', d.recipient_name, CASE WHEN d.tracking_code IS NOT NULL THEN CONCAT(' (Guía: ', d.tracking_code, ')') ELSE '' END)::text AS description,
          d.property_address::text,
          NULL::text AS vehicle_plates,
          TRUE AS is_granted,
          d.status::text,
          d.tracking_code::text AS rejection_reason,
          d.notes::text,
          COALESCE(d.collected_by_name, CONCAT_WS(' ', u.first_name, u.last_name))::text AS actor_name,
          d.received_at AS created_at
        FROM guard_deliveries d
        LEFT JOIN public.users u ON u.id = d.received_by

        UNION ALL

        -- 6. NOTICES
        SELECT 
          n.id::text,
          'NOTICE'::text AS event_type,
          'NOTICE' AS category,
          CONCAT('Aviso: ', n.title)::text AS title,
          n.content::text AS description,
          'Todo el Fraccionamiento'::text AS property_address,
          NULL::text AS vehicle_plates,
          TRUE AS is_granted,
          'PUBLISHED'::text AS status,
          NULL::text AS rejection_reason,
          CONCAT('Categoría: ', n.category, ' | Prioridad: ', n.priority)::text AS notes,
          n.author_name::text AS actor_name,
          n.published_at AS created_at
        FROM notices n
      )
    `;

    const [eventsResult, summaryResult] = await Promise.all([
      this.db.queryTenant(slug, `
        ${cteSql}
        SELECT * FROM combined_events
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `, params),
      this.db.queryTenant(slug, `
        ${cteSql}
        SELECT 
          COUNT(*)::int AS total_events,
          COUNT(*) FILTER (WHERE category = 'ACCESS' AND is_granted = TRUE)::int AS granted_access_count,
          COUNT(*) FILTER (WHERE category = 'ACCESS' AND is_granted = FALSE)::int AS rejected_access_count,
          COUNT(*) FILTER (WHERE category = 'SERVICE')::int AS services_count,
          COUNT(*) FILTER (WHERE category = 'INCIDENT')::int AS incidents_count,
          COUNT(*) FILTER (WHERE category = 'DELIVERY')::int AS deliveries_count,
          COUNT(*) FILTER (WHERE category = 'NOTICE')::int AS notices_count
        FROM combined_events
        ${whereClause}
      `, params),
    ]);

    const sumRow = summaryResult.rows[0] || {};
    const summary: UnifiedAuditLogSummary = {
      totalEvents: sumRow.total_events || 0,
      grantedAccessCount: sumRow.granted_access_count || 0,
      rejectedAccessCount: sumRow.rejected_access_count || 0,
      servicesCount: sumRow.services_count || 0,
      incidentsCount: sumRow.incidents_count || 0,
      deliveriesCount: sumRow.deliveries_count || 0,
      noticesCount: sumRow.notices_count || 0,
    };

    const events: UnifiedAuditLogItem[] = eventsResult.rows.map((row) => ({
      id: row.id,
      eventType: row.event_type,
      category: row.category,
      title: row.title,
      description: row.description,
      propertyAddress: row.property_address || undefined,
      vehiclePlates: row.vehicle_plates || undefined,
      isGranted: row.is_granted,
      status: row.status,
      rejectionReason: row.rejection_reason || undefined,
      notes: row.notes || undefined,
      actorName: row.actor_name || undefined,
      createdAt: row.created_at,
    }));

    return { summary, events };
  }
}