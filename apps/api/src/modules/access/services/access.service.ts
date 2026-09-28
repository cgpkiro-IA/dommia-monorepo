import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { DatabaseService } from '../../../database/database.service';
import { ResidentSessionClaims } from '../../auth/guards/resident-auth.guard';
import { AccessNotificationStatus, NotificationDeliveryService } from '../../notifications/services/notification-delivery.service';
import { TenantsRepository } from '../../tenants/repositories/tenants.repository';
import { CreateGuardUserDto, CreateVisitorInvitationDto, ManualAccessOverrideDto } from '../dto/access.dto';

const ACCESS_STEP_SECONDS = 15;
const MANUAL_OVERRIDE_TTL_MS = 5 * 60 * 1000;
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

interface AccessQrPayload {
  app: 'DOMMIA_ACCESS';
  kind: 'VISITOR' | 'RESIDENT';
  tenant: string;
  subjectId: string;
  step: number;
  code: string;
}

interface ManualOverrideClaims {
  purpose: 'DOMMIA_ACCESS_MANUAL_OVERRIDE';
  tenant: string;
  guardId: string;
  invitationId: string;
  step: number;
  exp: number;
}

function signManualOverrideToken(claims: ManualOverrideClaims) {
  const encoded = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = createHmac('sha256', process.env.AUTH_TOKEN_SECRET || 'dommia-local-auth-secret-change-me')
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

function verifyManualOverrideToken(token: string): ManualOverrideClaims {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) throw new UnauthorizedException('La autorización supervisada expiró o no es válida.');
  const expected = Buffer.from(createHmac('sha256', process.env.AUTH_TOKEN_SECRET || 'dommia-local-auth-secret-change-me').update(encoded).digest('base64url'));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new UnauthorizedException('La autorización supervisada expiró o no es válida.');
  }
  try {
    const claims = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as ManualOverrideClaims;
    if (claims.purpose !== 'DOMMIA_ACCESS_MANUAL_OVERRIDE'
      || !claims.tenant
      || !claims.guardId
      || !claims.invitationId
      || !Number.isSafeInteger(claims.step)
      || !Number.isSafeInteger(claims.exp)
      || claims.exp <= Date.now()) {
      throw new UnauthorizedException('La autorización supervisada expiró o no es válida.');
    }
    return claims;
  } catch (error) {
    if (error instanceof UnauthorizedException) throw error;
    throw new UnauthorizedException('La autorización supervisada expiró o no es válida.');
  }
}

function generateTotp(secretHex: string, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const secret = /^[0-9a-f]{40}$/i.test(secretHex)
    ? Buffer.from(secretHex, 'hex')
    : decodeBase32(secretHex);
  const digest = createHmac('sha1', secret).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24)
    | ((digest[offset + 1] & 0xff) << 16)
    | ((digest[offset + 2] & 0xff) << 8)
    | (digest[offset + 3] & 0xff);
  return String(binary % 100000000).padStart(8, '0');
}

function parseQrPayload(payload: string): AccessQrPayload | null {
  try {
    const parsed = JSON.parse(payload) as Partial<AccessQrPayload>;
    if (parsed.app !== 'DOMMIA_ACCESS'
      || (parsed.kind !== 'VISITOR' && parsed.kind !== 'RESIDENT')
      || typeof parsed.tenant !== 'string'
      || typeof parsed.subjectId !== 'string'
      || !Number.isSafeInteger(parsed.step)
      || typeof parsed.code !== 'string') return null;
    return parsed as AccessQrPayload;
  } catch {
    return null;
  }
}

@Injectable()
export class AccessService {
  private readonly logger = new Logger(AccessService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly tenants: TenantsRepository,
    private readonly notificationDelivery: NotificationDeliveryService,
  ) {}

  async listGuards(slug: string) {
    await this.assertAccessEnabled(slug);
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

  async createGuard(slug: string, dto: CreateGuardUserDto) {
    const tenant = await this.assertAccessEnabled(slug);
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
    `, [dto.email.trim().toLowerCase(), dto.password, dto.firstName.trim(), dto.lastName.trim(), tenant.id]);
    if (!result.rows[0]) {
      throw new ConflictException('Ya existe una cuenta con ese correo. Usa otro correo o solicita la asignación al administrador correspondiente.');
    }
    return result.rows[0];
  }

  async assertAccessEnabled(slug: string) {
    const tenant = await this.tenants.findByExactSlug(slug);
    if (!tenant || !tenant.is_active) throw new NotFoundException('Fraccionamiento no encontrado.');
    const modules = tenant.modules;
    const enabled = Array.isArray(modules)
      ? modules.includes('ACCESS_QR')
      : Boolean(modules && typeof modules === 'object' && modules['ACCESS_QR'] === true);
    if (!enabled) throw new ForbiddenException('Dommia Access QR no está habilitado para este fraccionamiento.');
    return tenant;
  }

  async createInvitation(claims: ResidentSessionClaims, dto: CreateVisitorInvitationDto) {
    await this.assertAccessEnabled(claims.tenantSlug);
    const invitationType = dto.passType === 'SINGLE_USE' ? 'SINGLE' : dto.passType === 'TEMPORARY' ? 'RECURRENT' : 'SERVICE';
    const result = await this.db.queryTenant(claims.tenantSlug, `
      INSERT INTO invitations (property_id, resident_id, visitor_name, invitation_type, valid_from, valid_until, notes)
      SELECT property_id, id, $3, $4, NOW(), NOW() + ($5::int * INTERVAL '1 day'), $6
      FROM residents
      WHERE id = $1 AND property_id = $2 AND is_active = TRUE
      RETURNING id, visitor_name, invitation_type, valid_from, valid_until, notes, is_active, used_at, created_at
    `, [claims.sub, claims.propertyId, dto.visitorName.trim(), invitationType, dto.validDays, dto.notes?.trim() || null]);
    if (!result.rows[0]) throw new NotFoundException('No se encontró una sesión residencial activa para crear el pase.');
    return this.toVisitorPass(result.rows[0], 0);
  }

  async listInvitations(claims: ResidentSessionClaims) {
    await this.assertAccessEnabled(claims.tenantSlug);
    const result = await this.db.queryTenant(claims.tenantSlug, `
      SELECT i.id, i.visitor_name, i.invitation_type, i.valid_from, i.valid_until, i.notes,
             i.is_active, i.used_at, i.created_at, COUNT(l.id)::int AS access_count
      FROM invitations i
      LEFT JOIN access_logs l ON l.identifier = i.id::text AND l.is_granted = TRUE
      WHERE i.resident_id = $1
      GROUP BY i.id
      ORDER BY i.created_at DESC
      LIMIT 100
    `, [claims.sub]);
    return result.rows.map((row) => this.toVisitorPass(row, row.access_count));
  }

  async revokeInvitation(claims: ResidentSessionClaims, id: string) {
    await this.assertAccessEnabled(claims.tenantSlug);
    const result = await this.db.queryTenant(claims.tenantSlug, `
      UPDATE invitations SET is_active = FALSE
      WHERE id = $1 AND resident_id = $2 AND is_active = TRUE
      RETURNING id
    `, [id, claims.sub]);
    if (!result.rows[0]) throw new NotFoundException('Pase activo no encontrado.');
    return { id, status: 'REVOKED' as const };
  }

  async getGuestPass(slug: string, id: string) {
    const tenant = await this.assertAccessEnabled(slug);
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
    const invitation = result.rows[0];
    if (!invitation) throw new NotFoundException('Pase de visita no disponible o vencido.');
    const step = Math.floor(Date.now() / 1000 / ACCESS_STEP_SECONDS);
    const qrPayload: AccessQrPayload = {
      app: 'DOMMIA_ACCESS',
      kind: 'VISITOR',
      tenant: slug,
      subjectId: invitation.id,
      step,
      code: generateTotp(invitation.totp_secret, step),
    };
    return {
      invitation: this.toVisitorPass(invitation, 0),
      communityName: tenant.name,
      propertyAddress: `${invitation.street} #${invitation.exterior_number}${invitation.interior_number ? ` int. ${invitation.interior_number}` : ''}`,
      hostName: `${invitation.first_name} ${invitation.last_name}`,
      qrPayload: JSON.stringify(qrPayload),
      stepExpiresAt: (step + 1) * ACCESS_STEP_SECONDS * 1000,
    };
  }

  async getResidentCredential(claims: ResidentSessionClaims) {
    await this.assertAccessEnabled(claims.tenantSlug);
    const result = await this.db.queryTenant(claims.tenantSlug, `
      SELECT r.id, r.access_totp_secret, r.is_active, p.street, p.exterior_number, p.interior_number
      FROM residents r
      JOIN properties p ON p.id = r.property_id
      WHERE r.id = $1 AND r.property_id = $2
    `, [claims.sub, claims.propertyId]);
    const resident = result.rows[0];
    if (!resident?.is_active) throw new NotFoundException('Credencial Resident no disponible.');

    const step = Math.floor(Date.now() / 1000 / ACCESS_STEP_SECONDS);
    const payload: AccessQrPayload = {
      app: 'DOMMIA_ACCESS',
      kind: 'RESIDENT',
      tenant: claims.tenantSlug,
      subjectId: resident.id,
      step,
      code: generateTotp(resident.access_totp_secret, step),
    };
    const stepExpiresAt = (step + 1) * ACCESS_STEP_SECONDS * 1000;
    return {
      code: payload.code,
      payload: JSON.stringify(payload),
      stepExpiresAt,
      timeRemaining: Math.max(0, Math.ceil((stepExpiresAt - Date.now()) / 1000)),
    };
  }

  async validateAccess(slug: string, operatorId: string, rawPayload: string) {
    await this.assertAccessEnabled(slug);
    const payload = parseQrPayload(rawPayload);
    const now = Date.now();
    const currentStep = Math.floor(now / 1000 / ACCESS_STEP_SECONDS);
    if (!payload || payload.tenant !== slug || payload.step !== currentStep) {
      return { authorized: false, reason: 'INVALID_OR_EXPIRED_QR' };
    }

    const validation = await this.db.withTenantTransaction(slug, async (client) => {
      const result = payload.kind === 'VISITOR' ? await client.query(`
        SELECT i.id, i.property_id, i.resident_id, i.visitor_name, i.invitation_type,
               i.valid_from, i.valid_until, i.totp_secret, i.is_active, i.used_at,
               i.last_used_step, p.is_delinquent, p.street, p.exterior_number, p.interior_number, 'VISITOR' AS kind,
               r.first_name, r.last_name, r.email AS host_email, r.phone AS host_phone
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
      const invitation = result.rows[0];
      if (!invitation) return { authorized: false, reason: 'PASS_NOT_FOUND' };

      let reason: string | null = null;
      if (!invitation.is_active) reason = 'PASS_REVOKED';
      else if (payload.step !== Math.floor(Date.now() / 1000 / ACCESS_STEP_SECONDS)) reason = 'INVALID_OR_EXPIRED_QR';
      else if (payload.kind === 'VISITOR' && new Date(invitation.valid_from).getTime() > now) reason = 'PASS_NOT_YET_VALID';
      else if (payload.kind === 'VISITOR' && new Date(invitation.valid_until).getTime() <= now) reason = 'PASS_EXPIRED';
      else if (payload.kind === 'VISITOR' && invitation.invitation_type === 'SINGLE' && invitation.used_at) reason = 'PASS_ALREADY_USED';
      else if (Number(invitation.last_used_step) === payload.step) reason = 'QR_ALREADY_USED';
      else {
        const expected = Buffer.from(generateTotp(invitation.totp_secret, payload.step));
        const actual = Buffer.from(payload.code);
        if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) reason = 'INVALID_QR';
      }

      if (!reason && invitation.is_delinquent) reason = 'PROPERTY_DELINQUENT';
      const granted = reason === null;
      await client.query(`
        INSERT INTO access_logs (access_type, identifier, property_id, is_granted, rejection_reason)
        VALUES ('DYNAMIC_QR', $1, $2, $3, $4)
      `, [invitation.id, invitation.property_id, granted, reason]);

      if (granted && payload.kind === 'VISITOR') {
        await client.query(`
          UPDATE invitations
          SET last_used_step = $2,
              used_at = CASE WHEN invitation_type = 'SINGLE' THEN NOW() ELSE used_at END,
              is_active = CASE WHEN invitation_type = 'SINGLE' THEN FALSE ELSE is_active END
          WHERE id = $1
        `, [invitation.id, payload.step]);
      } else if (granted) {
        await client.query('UPDATE residents SET last_access_used_step = $2 WHERE id = $1', [invitation.id, payload.step]);
      }

      return {
        authorized: granted,
        reason: reason || undefined,
        visitorName: invitation.visitor_name,
        propertyId: invitation.property_id,
        propertyAddress: `${invitation.street} #${invitation.exterior_number}${invitation.interior_number ? ` int. ${invitation.interior_number}` : ''}`,
        hostName: `${invitation.first_name} ${invitation.last_name}`,
        notificationContacts: payload.kind === 'VISITOR' ? { email: invitation.host_email, phone: invitation.host_phone } : undefined,
        manualOverrideToken: reason === 'PROPERTY_DELINQUENT' && payload.kind === 'VISITOR'
          ? signManualOverrideToken({
            purpose: 'DOMMIA_ACCESS_MANUAL_OVERRIDE',
            tenant: slug,
            guardId: operatorId,
            invitationId: invitation.id,
            step: payload.step,
            exp: Date.now() + MANUAL_OVERRIDE_TTL_MS,
          })
          : undefined,
        requiresManualReview: reason === 'PROPERTY_DELINQUENT',
        validatedBy: operatorId,
      };
    });

    const { notificationContacts, ...publicValidation } = validation;
    if (!validation.authorized || payload.kind !== 'VISITOR') return publicValidation;

    let notificationStatus: AccessNotificationStatus = 'FAILED';
    try {
      const tenant = await this.tenants.findByExactSlug(slug);
      notificationStatus = await this.notificationDelivery.sendAccessGranted(
        slug,
        notificationContacts || { email: null, phone: null },
        {
          visitorName: validation.visitorName || 'Visitante',
          communityName: tenant?.name || slug,
          propertyAddress: validation.propertyAddress || '',
          accessTime: new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
        },
      );
    } catch (error) {
      this.logger.warn(`No se pudo notificar al anfitrión tras validar el acceso en ${slug}: ${error instanceof Error ? error.message : 'error desconocido'}`);
    }

    return { ...publicValidation, notificationStatus };
  }

  async lookupGuardContext(slug: string, operatorId: string, query: string) {
    await this.assertAccessEnabled(slug);

    const normalized = query.trim();
    if (!normalized) {
      return { residents: [], vehicles: [], total: 0, query: '' };
    }

    const token = `%${normalized.toLowerCase()}%`;
    const platesToken = `%${normalized.replace(/\s+/g, '').toUpperCase()}%`;

    const [residentsResult, vehiclesResult] = await Promise.all([
      this.db.queryTenant(slug, `
        SELECT r.id, r.property_id, r.first_name, r.last_name, r.email, r.phone, r.role, r.is_primary, r.is_active,
               p.street, p.exterior_number, p.interior_number, p.block, p.lot, p.is_delinquent
        FROM residents r
        JOIN properties p ON p.id = r.property_id
        WHERE r.is_active = TRUE
          AND (
            LOWER(CONCAT(r.first_name, ' ', r.last_name)) LIKE $1 OR
            LOWER(COALESCE(r.email, '')) LIKE $1 OR
            LOWER(COALESCE(r.phone, '')) LIKE $1
          )
        ORDER BY r.is_primary DESC, r.last_name ASC, r.first_name ASC
        LIMIT 8
      `, [token]),
      this.db.queryTenant(slug, `
        SELECT v.id, v.property_id, v.resident_id, v.plates, v.brand, v.model, v.color,
               p.street, p.exterior_number, p.interior_number, p.block, p.lot, p.is_delinquent,
               r.first_name AS resident_first_name, r.last_name AS resident_last_name
        FROM vehicles v
        JOIN properties p ON p.id = v.property_id
        LEFT JOIN residents r ON r.id = v.resident_id
        WHERE UPPER(v.plates) LIKE $1
           OR LOWER(CONCAT(COALESCE(r.first_name, ''), ' ', COALESCE(r.last_name, ''))) LIKE $2
        ORDER BY v.plates ASC
        LIMIT 8
      `, [platesToken, token]),
    ]);

    const residents = residentsResult.rows.map((resident) => ({
      id: resident.id,
      propertyId: resident.property_id,
      firstName: resident.first_name,
      lastName: resident.last_name,
      fullName: `${resident.first_name} ${resident.last_name}`,
      email: resident.email,
      phone: resident.phone,
      role: resident.role,
      isPrimary: resident.is_primary,
      isActive: resident.is_active,
      propertyAddress: `${resident.street} #${resident.exterior_number}${resident.interior_number ? ` Int. ${resident.interior_number}` : ''}${resident.block ? ` ${resident.block}` : ''}${resident.lot ? ` Lote ${resident.lot}` : ''}`,
      isDelinquent: Boolean(resident.is_delinquent),
    }));

    const vehicles = vehiclesResult.rows.map((vehicle) => ({
      id: vehicle.id,
      propertyId: vehicle.property_id,
      residentId: vehicle.resident_id,
      plates: vehicle.plates,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      residentName: vehicle.resident_first_name && vehicle.resident_last_name
        ? `${vehicle.resident_first_name} ${vehicle.resident_last_name}`
        : 'Sin residente asociado',
      propertyAddress: `${vehicle.street} #${vehicle.exterior_number}${vehicle.interior_number ? ` Int. ${vehicle.interior_number}` : ''}${vehicle.block ? ` ${vehicle.block}` : ''}${vehicle.lot ? ` Lote ${vehicle.lot}` : ''}`,
      isDelinquent: Boolean(vehicle.is_delinquent),
    }));

    return {
      query: normalized,
      total: residents.length + vehicles.length,
      residents,
      vehicles,
      checkedBy: operatorId,
    };
  }

  async manualOverride(slug: string, guardId: string, dto: ManualAccessOverrideDto) {
    await this.assertAccessEnabled(slug);
    const claims = verifyManualOverrideToken(dto.overrideToken);
    if (claims.tenant !== slug || claims.guardId !== guardId) {
      throw new ForbiddenException('La excepción pertenece a otra sesión o fraccionamiento.');
    }

    const justification = dto.justification.trim();
    if (justification.length < 20) throw new BadRequestException('Describe una justificación de al menos 20 caracteres.');

    const validation = await this.db.withTenantTransaction(slug, async (client) => {
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
      `, [claims.invitationId]);
      const invitation = result.rows[0];
      if (!invitation || !invitation.is_active) throw new ConflictException('El pase ya no está activo. Vuelve a escanear el QR.');
      if (new Date(invitation.valid_from).getTime() > Date.now() || new Date(invitation.valid_until).getTime() <= Date.now()) {
        throw new ConflictException('El pase ya no está vigente. Vuelve a escanear el QR.');
      }
      if (invitation.invitation_type === 'SINGLE' && invitation.used_at) {
        throw new ConflictException('El pase de un solo uso ya fue consumido.');
      }
      if (Number(invitation.last_used_step) === claims.step) throw new ConflictException('El código QR ya fue utilizado.');
      if (!invitation.is_delinquent) throw new ConflictException('La propiedad ya no requiere una excepción manual.');

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
      `, [invitation.id, claims.step]);

      return {
        authorized: true,
        reason: 'PROPERTY_DELINQUENT',
        manualOverride: true,
        justification,
        visitorName: invitation.visitor_name,
        propertyId: invitation.property_id,
        propertyAddress: `${invitation.street} #${invitation.exterior_number}${invitation.interior_number ? ` int. ${invitation.interior_number}` : ''}`,
        hostName: `${invitation.first_name} ${invitation.last_name}`,
        notificationContacts: { email: invitation.host_email, phone: invitation.host_phone },
        validatedBy: guardId,
      };
    });

    let notificationStatus: AccessNotificationStatus = 'FAILED';
    try {
      const tenant = await this.tenants.findByExactSlug(slug);
      notificationStatus = await this.notificationDelivery.sendAccessGranted(slug, validation.notificationContacts, {
        visitorName: validation.visitorName,
        communityName: tenant?.name || slug,
        propertyAddress: validation.propertyAddress,
        accessTime: new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
      });
    } catch (error) {
      this.logger.warn(`No se pudo notificar al anfitrión tras una excepción manual en ${slug}: ${error instanceof Error ? error.message : 'error desconocido'}`);
    }

    const { notificationContacts: _notificationContacts, ...publicValidation } = validation;
    return { ...publicValidation, notificationStatus };
  }

  private toVisitorPass(row: Record<string, any>, accessCount: number) {
    const invitationType = row.invitation_type;
    const status = !row.is_active ? 'REVOKED' : new Date(row.valid_until).getTime() <= Date.now() ? 'EXPIRED' : 'ACTIVE';
    return {
      id: row.id,
      visitorName: row.visitor_name,
      validFrom: new Date(row.valid_from).toISOString(),
      validUntil: new Date(row.valid_until).toISOString(),
      passType: invitationType === 'SINGLE' ? 'SINGLE_USE' : invitationType === 'RECURRENT' ? 'TEMPORARY' : 'FREQUENT',
      accessCount,
      qrPayload: '',
      notes: row.notes || undefined,
      status,
      synced: true,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }
}

function decodeBase32(value: string): Buffer {
  let bits = 0;
  let accumulator = 0;
  const bytes: number[] = [];
  for (const character of value.toUpperCase().replace(/=+$/, '')) {
    const digit = BASE32_ALPHABET.indexOf(character);
    if (digit < 0) throw new BadRequestException('La semilla TOTP del pase no es válida.');
    accumulator = (accumulator << 5) | digit;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((accumulator >> bits) & 0xff);
    }
  }
  return Buffer.from(bytes);
}