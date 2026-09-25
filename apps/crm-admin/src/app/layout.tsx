import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DOMMIA CRM - El Sistema Operativo de tu Comunidad',
  description: 'Panel de control y backoffice comercial del operador SaaS DOMMIA.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
