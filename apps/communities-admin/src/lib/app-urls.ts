const configuredCrmUrl =
  process.env.NEXT_PUBLIC_CRM_URL?.trim() ||
  (process.env.NODE_ENV === 'production'
    ? 'https://crm.dommia.com.mx'
    : 'http://localhost:3001');

export const CRM_URL = new URL(configuredCrmUrl).origin;