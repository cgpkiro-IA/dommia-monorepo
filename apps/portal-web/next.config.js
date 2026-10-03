/** @type {import('next').NextConfig} */
const staticExport = process.env.NEXT_PUBLIC_PORTAL_STATIC_MODE === '1';

const nextConfig = {
  ...(staticExport ? { output: 'export' } : {}),
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  transpilePackages: ['@dommia/ui', '@dommia/shared-types'],
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  ...(!staticExport && { async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  } }),
};

module.exports = nextConfig;
