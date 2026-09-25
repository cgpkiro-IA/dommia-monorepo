'use client';
import React from 'react';
import { 
  Building2, 
  KeyRound, 
  Wallet, 
  Briefcase, 
  ShieldAlert, 
  Smartphone, 
  Cpu, 
  LineChart, 
  Check 
} from 'lucide-react';

const products = [
  {
    title: 'Dommia Communities',
    category: 'Administración Web',
    icon: Building2,
    badge: 'Núcleo Operativo',
    description:
      'Portal central para la mesa directiva y administradores. Control de padrón de colonos, gestión de cuotas, reservación de áreas comunes y comunicados oficiales en segundos.',
    accent: 'border-blue-500/30 hover:border-blue-500/60',
  },
  {
    title: 'Dommia Access',
    category: 'Control de Accesos',
    icon: KeyRound,
    badge: 'RFID + QR TOTP',
    description:
      'Apertura vehicular automática con antenas UHF de largo alcance en menos de 0.3 segundos. Invitaciones seguras con códigos QR dinámicos que cambian cada 30 segundos.',
    accent: 'border-emerald-500/30 hover:border-emerald-500/60',
  },
  {
    title: 'Dommia Finance',
    category: 'Fintech & Cobranza',
    icon: Wallet,
    badge: 'Stripe & SPEI',
    description:
      'Motor contable con cálculo automático de recargos por morosidad, conciliación de pagos con tarjeta vía Stripe y referencias bancarias SPEI sin intervención manual.',
    accent: 'border-amber-500/30 hover:border-amber-500/60',
  },
  {
    title: 'Dommia CRM',
    category: 'Plataforma SaaS',
    icon: Briefcase,
    badge: 'Backoffice Central',
    description:
      'Panel ejecutivo para el operador del SaaS. Gestión del pipeline comercial, aprovisionamiento automatizado de esquemas de bases de datos y monitoreo global de facturación.',
    accent: 'border-purple-500/30 hover:border-purple-500/60',
  },
  {
    title: 'Dommia Guard',
    category: 'Caseta de Vigilancia',
    icon: ShieldAlert,
    badge: 'Alto Contraste',
    description:
      'Interfaz web ultraligera diseñada para monitores en caseta. Pantallas oscuras de alto contraste, lectura instantánea de placas, tags y alertas de colonos con adeudos.',
    accent: 'border-red-500/30 hover:border-red-500/60',
  },
  {
    title: 'Dommia Resident',
    category: 'App para Colonos',
    icon: Smartphone,
    badge: 'PWA Offline-First',
    description:
      'Aplicación web instalable en iOS y Android sin pasar por App Store. Generación de pases QR para visitas, historial de pagos, consulta de estados de cuenta y botón de pánico.',
    accent: 'border-sky-500/30 hover:border-sky-500/60',
  },
  {
    title: 'Dommia IoT',
    category: 'Hardware & Caseta',
    icon: Cpu,
    badge: 'MQTT & SQLite',
    description:
      'Microcontroladores y gateways instalados en caseta con persistencia local en SQLite. Si se corta el internet o la fibra óptica, las plumas continúan abriendo sin retraso.',
    accent: 'border-indigo-500/30 hover:border-indigo-500/60',
  },
  {
    title: 'Dommia Analytics',
    category: 'Inteligencia Operativa',
    icon: LineChart,
    badge: 'Tableros en Vivo',
    description:
      'Métricas en tiempo real de recaudación, horas pico de tráfico vehicular, aforos en amenidades y auditoría completa de seguridad con un clic.',
    accent: 'border-teal-500/30 hover:border-teal-500/60',
  },
];

export const ProductEcosystem: React.FC = () => {
  return (
    <section id="ecosistema" className="py-24 bg-[#0F172A] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-500/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <span>Ecosistema Modular Integrado</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-heading mb-4">
            Un Ecosistema Conectado. 8 Soluciones Especializadas.
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            Cada módulo de DOMMIA resuelve una necesidad crítica de tu fraccionamiento trabajando en perfecta sincronía.
          </p>
        </div>

        {/* 8 Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className={`p-6 rounded-2xl bg-slate-900/70 border ${p.accent} shadow-lg transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {p.badge}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                    {p.category}
                  </span>
                  <h3 className="text-lg font-bold text-white font-heading mt-0.5 mb-2.5">
                    {p.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center text-xs text-slate-300 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
                  <span>Totalmente Integrado</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
