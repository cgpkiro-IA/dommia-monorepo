const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

if (!configuredApiUrl || !/^https?:\/\//i.test(configuredApiUrl)) {
  throw new Error('NEXT_PUBLIC_API_URL debe definir una URL HTTP(S) antes de compilar CRM.');
}

export const API_BASE = configuredApiUrl.replace(/\/+$/, '');