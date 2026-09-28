import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { CreateGuardUserDto, CreateVisitorInvitationDto } from '../dto/access.dto';

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
              used_at = CASE WHEN invitation_type = 'SINGLE' THEN NOW() ELSE used_at END,
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
                   'validFrom', i.valid_from, 'validUntil', i.valid_until, 'notes', i.notes
                 ) ORDER BY i.valid_until ASC)
                 FROM invitations i
                 WHERE i.resident_id = r.id AND i.is_active = TRUE
                   AND i.valid_from <= NOW() AND i.valid_until > NOW()
                   AND (i.invitation_type <> 'SINGLE' OR i.used_at IS NULL)
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

  async authorizeManualVisit(slug: string, invitationId: string, guardId: string): Promise<ManualVisitAccessResult> {
    return this.db.withTenantTransaction(slug, async (client) => {
      const result = await client.query(`
        SELECT i.id, i.property_id, i.resident_id, i.visitor_name, i.invitation_type,
               i.valid_from, i.valid_until, i.is_active, i.used_at,
               p.street, p.exterior_number, p.interior_number, p.block, p.lot,
               concat_ws(' ', r.first_name, r.last_name) AS host_name
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

      if (invitation.invitation_type === 'SINGLE') {
        await client.query(`
          UPDATE invitations SET used_at = NOW(), is_active = FALSE WHERE id = $1
        `, [invitation.id]);
      }

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
}