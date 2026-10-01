const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const useLocalDevelopmentProxy = process.env.NODE_ENV === 'development' && configuredApiUrl === '/api/v1';

if (!configuredApiUrl || (!/^https?:\/\//i.test(configuredApiUrl) && !useLocalDevelopmentProxy)) {
  throw new Error('NEXT_PUBLIC_API_URL debe definir una URL HTTP(S); en desarrollo Guard también admite /api/v1.');
}

export const API_BASE = configuredApiUrl.replace(/\/+$/, '');