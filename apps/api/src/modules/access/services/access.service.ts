import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { ResidentSessionClaims } from '../../auth/guards/resident-auth.guard';
import { AccessNotificationStatus, NotificationDeliveryService } from '../../notifications/services/notification-delivery.service';
import { TenantsRepository } from '../../tenants/repositories/tenants.repository';
import { CreateGuardUserDto, CreateVisitorInvitationDto, ManualAccessOverrideDto, ManualVisitAccessDto } from '../dto/access.dto';
import { AccessRepository, AccessQrPayload, ManualOverrideClaims } from '../repositories/access.repository';

const ACCESS_STEP_SECONDS = 15;
const MANUAL_OVERRIDE_TTL_MS = 5 * 60 * 1000;
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

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
    private readonly accessRepository: AccessRepository,
    private readonly tenants: TenantsRepository,
    private readonly notificationDelivery: NotificationDeliveryService,
  ) {}

  async listGuards(slug: string) {
    await this.assertAccessEnabled(slug);
    return this.accessRepository.listGuards(slug);
  }

  async createGuard(slug: string, dto: CreateGuardUserDto) {
    const tenant = await this.assertAccessEnabled(slug);
    const guard = await this.accessRepository.createGuard(tenant.id, dto);
    if (!guard) {
      throw new ConflictException('Ya existe una cuenta con ese correo. Usa otro correo o solicita la asignación al administrador correspondiente.');
    }
    return guard;
  }

  async assertAccessEnabled(slug: string) {
    const tenant = await this.tenants.findByExactSlug(slug);
    if (!tenant || !tenant.is_active) throw new NotFoundException('Fraccionamiento no encontrado.');
    const modules = tenant.modules;
    const enabled = Array.isArray(modules)
      ? modules.includes('ACCESS_QR')
      : Boolean(modules && typeof modules === 'object' && (modules['ACCESS_QR'] === true || modules['dynamic_qr'] === true));
    if (!enabled) throw new ForbiddenException('Dommia Access QR no está habilitado para este fraccionamiento.');
    return tenant;
  }

  async createInvitation(claims: ResidentSessionClaims, dto: CreateVisitorInvitationDto) {
    await this.assertAccessEnabled(claims.tenantSlug);
    const invitation = await this.accessRepository.createInvitation(claims.tenantSlug, claims.sub, claims.propertyId, dto);
    if (!invitation) throw new NotFoundException('No se encontró una sesión residencial activa para crear el pase.');
    return this.toVisitorPass(invitation, 0);
  }

  async listInvitations(claims: ResidentSessionClaims) {
    await this.assertAccessEnabled(claims.tenantSlug);
    const rows = await this.accessRepository.listInvitations(claims.tenantSlug, claims.sub);
    return rows.map((row) => this.toVisitorPass(row, row.access_count));
  }

  async revokeInvitation(claims: ResidentSessionClaims, id: string) {
    await this.assertAccessEnabled(claims.tenantSlug);
    const invitation = await this.accessRepository.revokeInvitation(claims.tenantSlug, claims.sub, id);
    if (!invitation) throw new NotFoundException('Pase activo no encontrado.');
    return { id, status: 'REVOKED' as const };
  }

  async getGuestPass(slug: string, id: string) {
    const tenant = await this.assertAccessEnabled(slug);
    const invitation = await this.accessRepository.findGuestPass(slug, id);
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
    const resident = await this.accessRepository.findResidentCredential(claims.tenantSlug, claims.sub, claims.propertyId);
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

    const validation = await this.accessRepository.validateAccess(slug, operatorId, payload, (invitation, validationNow) => {
      let reason: string | null = null;
      if (!invitation.is_active) reason = 'PASS_REVOKED';
      else if (payload.step !== Math.floor(Date.now() / 1000 / ACCESS_STEP_SECONDS)) reason = 'INVALID_OR_EXPIRED_QR';
      else if (payload.kind === 'VISITOR' && new Date(invitation.valid_from).getTime() > validationNow) reason = 'PASS_NOT_YET_VALID';
      else if (payload.kind === 'VISITOR' && new Date(invitation.valid_until).getTime() <= validationNow) reason = 'PASS_EXPIRED';
      else if (payload.kind === 'VISITOR' && invitation.invitation_type === 'SINGLE' && invitation.used_at) reason = 'PASS_ALREADY_USED';
      else if (Number(invitation.last_used_step) === payload.step) reason = 'QR_ALREADY_USED';
      else {
        const expected = Buffer.from(generateTotp(invitation.totp_secret, payload.step));
        const actual = Buffer.from(payload.code);
        if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) reason = 'INVALID_QR';
      }
      if (!reason && invitation.is_delinquent) reason = 'PROPERTY_DELINQUENT';
      return reason;
    });

    const invitation = validation.subject;
    if (!invitation) return { authorized: false, reason: 'PASS_NOT_FOUND' };
    const notificationContacts = payload.kind === 'VISITOR'
      ? { email: invitation.host_email, phone: invitation.host_phone }
      : undefined;
    const publicValidation = {
      authorized: validation.authorized,
      reason: validation.reason,
      visitorName: invitation.visitor_name,
      propertyId: invitation.property_id,
      propertyAddress: `${invitation.street} #${invitation.exterior_number}${invitation.interior_number ? ` int. ${invitation.interior_number}` : ''}`,
      hostName: `${invitation.first_name} ${invitation.last_name}`,
      manualOverrideToken: validation.reason === 'PROPERTY_DELINQUENT' && payload.kind === 'VISITOR'
        ? signManualOverrideToken({
          purpose: 'DOMMIA_ACCESS_MANUAL_OVERRIDE',
          tenant: slug,
          guardId: operatorId,
          invitationId: invitation.id,
          step: payload.step,
          exp: Date.now() + MANUAL_OVERRIDE_TTL_MS,
        })
        : undefined,
      requiresManualReview: validation.reason === 'PROPERTY_DELINQUENT',
      validatedBy: operatorId,
    };
    if (!validation.authorized || payload.kind !== 'VISITOR') return publicValidation;

    let notificationStatus: AccessNotificationStatus = 'FAILED';
    try {
      const tenant = await this.tenants.findByExactSlug(slug);
      notificationStatus = await this.notificationDelivery.sendAccessGranted(
        slug,
        notificationContacts || { email: null, phone: null },
        {
          visitorName: invitation.visitor_name || 'Visitante',
          communityName: tenant?.name || slug,
          propertyAddress: publicValidation.propertyAddress || '',
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
    const normalizedPlateQuery = normalized.replace(/[^a-z0-9]/gi, '').toUpperCase();
    const platesToken = `%${normalizedPlateQuery}%`;

    const context = await this.accessRepository.findGuardContext(slug, token, platesToken, Boolean(normalizedPlateQuery));

    const residents = context.residents.map((resident) => ({
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
      activePasses: resident.active_passes || [],
    }));

    const vehicles = context.vehicles.map((vehicle) => ({
      id: vehicle.id,
      propertyId: vehicle.property_id,
      residentId: vehicle.resident_id,
      plates: vehicle.plates,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      residentRole: vehicle.resident_role || null,
      classification: vehicle.flag_type || vehicle.resident_role || (vehicle.resident_id ? 'REGISTERED' : 'UNASSIGNED'),
      flagReason: vehicle.flag_reason || undefined,
      blocked: vehicle.flag_type === 'BLOCKED',
      residentName: vehicle.resident_first_name && vehicle.resident_last_name
        ? `${vehicle.resident_first_name} ${vehicle.resident_last_name}`
        : 'Sin residente asociado',
      propertyAddress: `${vehicle.street} #${vehicle.exterior_number}${vehicle.interior_number ? ` Int. ${vehicle.interior_number}` : ''}${vehicle.block ? ` ${vehicle.block}` : ''}${vehicle.lot ? ` Lote ${vehicle.lot}` : ''}`,
      isDelinquent: Boolean(vehicle.is_delinquent),
    }));

    const registeredPlates = new Set(vehicles.map((vehicle) => vehicle.plates.replace(/[^a-z0-9]/gi, '').toUpperCase()));
    for (const flag of context.flags) {
      const plateKey = flag.plates.replace(/[^a-z0-9]/gi, '').toUpperCase();
      if (registeredPlates.has(plateKey)) continue;
      vehicles.push({
        id: flag.id,
        propertyId: undefined,
        residentId: undefined,
        plates: flag.plates,
        brand: undefined,
        model: undefined,
        color: undefined,
        residentRole: null,
        classification: flag.flag_type,
        flagReason: flag.reason,
        blocked: flag.flag_type === 'BLOCKED',
        residentName: 'Vehículo sin registro comunitario',
        propertyAddress: undefined,
        isDelinquent: false,
      });
    }

    return {
      query: normalized,
      total: residents.length + vehicles.length,
      residents,
      vehicles,
      checkedBy: operatorId,
    };
  }

  async findManualVisitCandidates(slug: string, guardId: string, query: string) {
    await this.assertAccessEnabled(slug);
    const normalized = query.trim().slice(0, 120);
    if (normalized.length < 2) return { query: normalized, candidates: [] };

    const rows = await this.accessRepository.findManualVisitCandidates(slug, `%${normalized}%`);
    const now = Date.now();
    return {
      query: normalized,
      checkedBy: guardId,
      candidates: rows.map((row: Record<string, any>) => ({
        invitationId: row.id,
        visitorName: row.visitor_name,
        passType: row.invitation_type === 'SINGLE' ? 'SINGLE_USE' : row.invitation_type === 'RECURRENT' ? 'TEMPORARY' : 'FREQUENT',
        validFrom: new Date(row.valid_from).toISOString(),
        validUntil: new Date(row.valid_until).toISOString(),
        isCurrentlyValid: new Date(row.valid_from).getTime() <= now && new Date(row.valid_until).getTime() > now,
        notes: row.notes || undefined,
        propertyId: row.property_id,
        propertyAddress: `${row.street} #${row.exterior_number}${row.interior_number ? ` Int. ${row.interior_number}` : ''}${row.block ? ` ${row.block}` : ''}${row.lot ? ` Lote ${row.lot}` : ''}`,
        hostName: row.host_name,
        hostPhone: row.host_phone || undefined,
      })),
    };
  }

  async authorizeManualVisit(slug: string, guardId: string, invitationId: string, dto: ManualVisitAccessDto) {
    await this.assertAccessEnabled(slug);
    if (dto.identityVerified !== true) throw new BadRequestException('Confirma la validación visual de la INE antes de continuar.');
    if (dto.callConfirmed !== true) throw new BadRequestException('Confirma que la propiedad autorizó el acceso por llamada.');

    const result = await this.accessRepository.authorizeManualVisit(slug, invitationId, guardId);
    if (result.kind === 'NOT_FOUND') throw new NotFoundException('La visita programada ya no existe.');
    if (result.kind === 'NOT_YET_VALID') throw new ConflictException('La visita todavía no está vigente.');
    if (result.kind === 'EXPIRED') throw new ConflictException('La visita ya venció.');
    if (result.kind === 'INACTIVE') throw new ConflictException('La visita fue revocada.');
    if (result.kind === 'ALREADY_USED') throw new ConflictException('Este pase de un solo uso ya fue consumido.');

    const invitation = result.invitation;
    return {
      authorized: true,
      manualAccess: true,
      authorizationMethod: 'CALL_CONFIRMED',
      reason: 'MANUAL_NO_QR_CALL_CONFIRMED',
      visitorName: invitation.visitor_name,
      propertyId: invitation.property_id,
      propertyAddress: `${invitation.street} #${invitation.exterior_number}${invitation.interior_number ? ` int. ${invitation.interior_number}` : ''}${invitation.block ? ` ${invitation.block}` : ''}${invitation.lot ? ` Lote ${invitation.lot}` : ''}`,
      hostName: invitation.host_name,
      validatedBy: guardId,
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

    const override = await this.accessRepository.createManualOverride(slug, claims.invitationId, claims.step, guardId, justification);
    if (override.kind === 'INACTIVE') throw new ConflictException('El pase ya no está activo. Vuelve a escanear el QR.');
    if (override.kind === 'NOT_VALID') throw new ConflictException('El pase ya no está vigente. Vuelve a escanear el QR.');
    if (override.kind === 'ALREADY_USED') throw new ConflictException('El pase de un solo uso ya fue consumido.');
    if (override.kind === 'QR_ALREADY_USED') throw new ConflictException('El código QR ya fue utilizado.');
    if (override.kind === 'NOT_DELINQUENT') throw new ConflictException('La propiedad ya no requiere una excepción manual.');
    const invitation = override.invitation;
    const validation = {
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