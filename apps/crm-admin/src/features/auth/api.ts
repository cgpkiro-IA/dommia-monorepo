const API_BASE = 'http://localhost:4000/api/v1';
const SESSION_KEY = 'dommia-crm-session';

export function readCrmToken() {
  if (typeof window === 'undefined') return null;
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') as { token?: string } | null;
    return session?.token || null;
  } catch {
    return null;
  }
}

export async function crmApiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = readCrmToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (response.status === 401 && !path.endsWith('/auth/login') && !path.endsWith('/auth/mfa/verify')) {
    sessionStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event('dommia-crm-unauthorized'));
  }
  return response;
}

export { API_BASE, SESSION_KEY };