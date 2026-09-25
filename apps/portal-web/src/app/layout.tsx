import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DOMMIA | El Sistema Operativo de tu Comunidad Residencial',
  description:
    'Dommia es la plataforma inteligente que conecta administración, finanzas, seguridad y tecnología IoT para operar comunidades residenciales modernas desde un solo lugar.',
  keywords: [
    'SaaS fraccionamientos',
    'administración de condominios',
    'control de acceso RFID',
    'QR dinámico TOTP',
    'conciliación bancaria residencial',
    'sistema de plumas inteligente',
    'software condominios México',
    'Dommia Communities',
  ],
  authors: [{ name: 'DOMMIA Technologies' }],
  creator: 'DOMMIA',
  publisher: 'DOMMIA SaaS',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: 'https://dommia.com',
    siteName: 'DOMMIA Communities',
    title: 'DOMMIA | El Sistema Operativo de tu Comunidad Residencial',
    description:
      'Conecta administración, seguridad, finanzas e infraestructura inteligente en una experiencia moderna, escalable y confiable.',
    images: [
      {
        url: 'https://dommia.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DOMMIA - El Sistema Operativo de tu Comunidad',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DOMMIA | El Sistema Operativo de tu Comunidad',
    description:
      'La plataforma que conecta administración, seguridad, residentes e IoT para comunidades modernas.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'DOMMIA Communities',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web, iOS, Android',
              offers: {
                '@type': 'Offer',
                price: '1490',
                priceCurrency: 'MXN',
              },
              description:
                'Plataforma integral para administración, accesos vehiculares RFID, cobranza y convivencia en comunidades residenciales.',
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-[#0B1120] text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
