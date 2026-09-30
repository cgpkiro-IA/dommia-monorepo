const configuredCommunitiesUrl = process.env.NEXT_PUBLIC_COMMUNITIES_URL?.trim();

if (!configuredCommunitiesUrl || !/^https?:\/\//i.test(configuredCommunitiesUrl)) {
  throw new Error('NEXT_PUBLIC_COMMUNITIES_URL debe definir una URL HTTP(S) antes de compilar CRM.');
}

export const COMMUNITIES_URL = new URL(configuredCommunitiesUrl).origin;