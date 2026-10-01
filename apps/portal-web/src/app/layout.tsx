import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { Analytics } from '../components/Analytics';

export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dommia.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'DOMMIA | El Sistema Operativo de tu Comunidad Residencial',
    template: '%s | DOMMIA',
  },
  description:
    'DOMMIA es la plataforma inteligente que conecta administración, finanzas, seguridad y tecnología IoT para operar comunidades residenciales y condominios modernos.',
  keywords: [
    'SaaS fraccionamientos',
    'administración de condominios',
    'control de acceso RFID',
    'QR dinámico TOTP',
    'conciliación bancaria residencial',
    'sistema de plumas inteligente',
    'software condominios México',
    'Dommia Communities',
    'plataforma residencial inteligente',
    'app para condominios',
    'gestión de fraccionamientos',
  ],
  authors: [{ name: 'DOMMIA Technologies', url: 'https://dommia.com' }],
  creator: 'DOMMIA',
  publisher: 'DOMMIA Technologies',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: siteUrl,
    siteName: 'DOMMIA',
    title: 'DOMMIA | El Sistema Operativo de tu Comunidad Residencial',
    description:
      'Conecta administración, seguridad, finanzas e infraestructura inteligente en una experiencia moderna, escalable y confiable.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
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
    images: [`${siteUrl}/og-image.png`],
  },
};

const jsonLdSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'DOMMIA Technologies',
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      description:
        'Empresa de tecnología SaaS y soluciones IoT para comunidades residenciales y condominios.',
      sameAs: ['https://twitter.com/dommia_app', 'https://linkedin.com/company/dommia'],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'DOMMIA',
      publisher: { '@id': `${siteUrl}/#organization` },
      inLanguage: 'es-MX',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${siteUrl}/#software`,
      name: 'DOMMIA Communities',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: [
        {
          '@type': 'Offer',
          name: 'Dommia Básico',
          price: '1490',
          priceCurrency: 'MXN',
          description: 'Para cotos y privadas de hasta 50 viviendas.',
        },
        {
          '@type': 'Offer',
          name: 'Dommia Estándar',
          price: '2990',
          priceCurrency: 'MXN',
          description: 'Control con códigos QR dinámicos para hasta 150 viviendas.',
        },
        {
          '@type': 'Offer',
          name: 'Dommia Profesional',
          price: '4990',
          priceCurrency: 'MXN',
          description: 'Automatización vehicular por RFID y pasarela fintech para hasta 300 viviendas.',
        },
      ],
      description:
        'Plataforma integral para administración, accesos vehiculares RFID, cobranza y convivencia en comunidades residenciales.',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿Cómo funciona el control de acceso si se corta el internet?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'DOMMIA cuenta con arquitectura distribuida tolerante a fallos: el Gateway local de caseta mantiene una base de datos sincronizada que valida TAGs RFID y pases autorizados incluso sin conexión a internet.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Qué es el código QR Dinámico TOTP?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Es una tecnología de seguridad donde el código QR rota y se regenera automáticamente cada 15 a 30 segundos, evitando capturas de pantalla o reenvío no autorizado de pases de visita.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cómo se concilian las cuotas de mantenimiento?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'DOMMIA permite pagos con tarjeta mediante pasarelas seguras (Stripe) y transferencias SPEI con validación directa o conciliación manual por comprobante de pago.',
          },
        },
      ],
    },
  ],
};

const jsonLd = JSON.stringify(jsonLdSchema).replace(/</g, '\\u003c');

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get('x-nonce') || undefined;

  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      </head>
      <body className="min-h-screen bg-[#0B1120] text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <Analytics nonce={nonce} />
        {children}
      </body>
    </html>
  );
}
