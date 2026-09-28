import { TenantModule } from '@dommia/shared-types';
import type { AccessResult, ResultState } from './types';

export function hasAccessModule(modules: unknown) {
  if (Array.isArray(modules)) return modules.includes(TenantModule.ACCESS_QR);
  if (modules && typeof modules === 'object') {
    const tenantModules = modules as Record<string, unknown>;
    return Boolean(tenantModules[TenantModule.ACCESS_QR] || tenantModules.dynamic_qr);
  }
  return false;
}

export function reasonText(reason?: string) {
  if (!reason) return 'El codigo no esta autorizado.';
  const known: Record<string, string> = {
    PROPERTY_DELINQUENT: 'La propiedad requiere revisión manual antes de permitir el acceso.',
    INVALID_OR_EXPIRED_QR: 'El código QR no es válido o ya venció. Acceso denegado.',
    INVALID_QR: 'El código QR no es válido. Acceso denegado.',
    PASS_NOT_FOUND: 'No se encontró el pase. Acceso denegado.',
    PASS_REVOKED: 'El pase fue revocado. Acceso denegado.',
    PASS_NOT_YET_VALID: 'El pase todavía no está vigente. Acceso denegado.',
    PASS_EXPIRED: 'El pase venció. Acceso denegado.',
    PASS_ALREADY_USED: 'El pase de un solo uso ya fue utilizado. Acceso denegado.',
    QR_ALREADY_USED: 'Este código QR ya fue utilizado. Acceso denegado.',
  };
  return known[reason] || reason.replaceAll('_', ' ').toLowerCase();
}

export function notificationText(status?: AccessResult['notificationStatus']) {
  if (status === 'SENT_WHATSAPP') return 'Aviso enviado al anfitrión por WhatsApp.';
  if (status === 'SENT_EMAIL') return 'Aviso enviado al anfitrión por correo.';
  if (status === 'NOT_CONFIGURED') return 'No se notificó al anfitrión porque no hay un canal premium configurado.';
  if (status === 'FAILED') return 'El acceso quedó registrado, pero no se pudo notificar al anfitrión. Informa a administración.';
  return '';
}

export function vehicleClassificationText(classification?: string) {
  const labels: Record<string, string> = {
    OWNER: 'Propietario',
    TENANT: 'Inquilino',
    FAMILY_MEMBER: 'Familiar',
    FREQUENT_VISITOR: 'Visita frecuente',
    BLOCKED: 'Lista de bloqueo',
    REGISTERED: 'Registrado',
    UNASSIGNED: 'Sin residente asignado',
  };
  return labels[classification || ''] || 'Sin clasificar';
}

export function vehicleClassificationTone(classification?: string) {
  const tones: Record<string, string> = {
    OWNER: 'owner',
    TENANT: 'tenant',
    FAMILY_MEMBER: 'family',
    FREQUENT_VISITOR: 'frequent',
    BLOCKED: 'bad',
    REGISTERED: 'registered',
    UNASSIGNED: 'unknown',
  };
  return tones[classification || ''] || 'unknown';
}

export function resultMarkName(kind: ResultState['kind']) {
  if (kind === 'authorized') return 'check';
  if (kind === 'review') return 'alert';
  if (kind === 'denied') return 'denied';
  return 'help';
}