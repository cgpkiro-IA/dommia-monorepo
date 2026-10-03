import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DOMMIA - El Sistema Operativo de tu Comunidad',
    short_name: 'DOMMIA',
    description:
      'Plataforma inteligente que conecta administración, finanzas, seguridad y tecnología IoT para comunidades residenciales.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B1120',
    theme_color: '#2563EB',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
