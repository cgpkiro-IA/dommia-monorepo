import type { Metadata } from 'next';
import { ConfirmActionProvider } from '@/features/dashboard/components/ConfirmActionProvider';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dommia Communities • Portal Operativo del Fraccionamiento',
  description: 'Sistema Operativo de tu Comunidad. Gestión de propiedades, residentes, accesos y tesorería.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        <ConfirmActionProvider>{children}</ConfirmActionProvider>
      </body>
    </html>
  );
}
