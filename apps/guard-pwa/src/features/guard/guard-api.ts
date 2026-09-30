import type { GuardSession } from './types';
import { hasAccessModule } from './guard-utils';
import { parseClientError } from '@dommia/ui';
import { API_BASE } from '@/lib/api-url';

export { API_BASE };
export const GUARD_SESSION_KEY = 'dommia_guard_session';

export async function guardApiRequest<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: init.cache || 'no-store' });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success) {
    const errorState = parseClientError(body || { status: response.status }, 'No se pudo completar la operación en caseta.');
    throw new Error(errorState.description);
  }
  return body.data as T;
}

export async function loginGuard(email: string, password: string, tenantSlug: string): Promise<GuardSession> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, tenantSlug }),
  });
  const body = await response.json().catch(() => null);
  const data = body?.data;
  const activeTenant = data?.activeTenant;
  if (!response.ok || !body?.success || activeTenant?.role !== 'GUARD') {
    throw new Error('Acceso no disponible. Verifica tus datos y que tu cuenta tenga el rol de guardia.');
  }
  if (!hasAccessModule(activeTenant.modules)) {
    throw new Error('Dommia Access QR no está habilitado para este fraccionamiento.');
  }
  if (typeof data?.token !== 'string' || !data.token) {
    throw new Error('La respuesta de inicio de sesión no incluyó una credencial válida.');
  }
  return {
    token: data.token,
    tenantSlug: activeTenant.slug || tenantSlug,
    tenantName: activeTenant.name || activeTenant.tenantName || activeTenant.slug || tenantSlug,
  };
}