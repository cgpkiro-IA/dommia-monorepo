const configuredApiUrl =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  (process.env.NODE_ENV === 'production'
    ? 'https://api.dommia.com.mx/api/v1'
    : 'http://localhost:4000/api/v1');

export const API_BASE = configuredApiUrl.replace(/\/+$/, '');