const configuredCrmUrl = process.env.NEXT_PUBLIC_CRM_URL?.trim();

if (!configuredCrmUrl || !/^https?:\/\//i.test(configuredCrmUrl)) {
  throw new Error('NEXT_PUBLIC_CRM_URL debe definir una URL HTTP(S) antes de compilar Portal.');
}

export const CRM_URL = new URL(configuredCrmUrl).origin;