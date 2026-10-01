interface CspOptions {
  googleAnalytics?: boolean;
}

function getApiOrigin() {
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configuredApiUrl) return undefined;

  try {
    return new URL(configuredApiUrl).origin;
  } catch {
    return undefined;
  }
}

export function buildCsp(nonce: string, options: CspOptions = {}) {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const scriptSources = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
  ];
  const connectSources = ["'self'", getApiOrigin()];
  const imageSources = ["'self'", 'data:', 'blob:', 'https:'];

  if (isDevelopment) {
    scriptSources.push("'unsafe-eval'");
    connectSources.push('http://localhost:*', 'http://127.0.0.1:*', 'ws://localhost:*', 'ws://127.0.0.1:*');
  }

  if (options.googleAnalytics) {
    scriptSources.push('https://www.googletagmanager.com');
    connectSources.push(
      'https://www.google-analytics.com',
      'https://region1.google-analytics.com',
      'https://analytics.google.com',
    );
    imageSources.push('https://www.google-analytics.com', 'https://stats.g.doubleclick.net');
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSources.filter(Boolean).join(' ')}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `img-src ${imageSources.join(' ')}`,
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src ${connectSources.filter(Boolean).join(' ')}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ];

  if (!isDevelopment) directives.push('upgrade-insecure-requests');

  return directives.join('; ');
}