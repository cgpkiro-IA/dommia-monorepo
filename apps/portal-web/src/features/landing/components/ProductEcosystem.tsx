'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  KeyRound, 
  Wallet, 
  Briefcase, 
  ShieldAlert, 
  Smartphone, 
  Cpu, 
  LineChart, 
  CheckCircle2,
  Lock,
  QrCode,
  Sparkles
} from 'lucide-react';

interface ProductItem {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  category: string;
  pillar: 'ADMIN' | 'SECURITY' | 'RESIDENTS';
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  techSpec: string;
  description: string;
  highlights: string[];
  gradient: string;
  accentColor: string;
  isUpcoming?: boolean;
}

const products: ProductItem[] = [
  {
    id: 'access',
    index: '01',
    title: 'Dommia Access',
    subtitle: 'QR Dinámico TOTP',
    category: 'Control de Accesos & Visitas',
    pillar: 'SECURITY',
    icon: QrCode,
    badge: 'Disponible',
    isUpcoming: false,
    techSpec: 'TOTP CRYPTO 20S • VALIDACIÓN EN CASETA',
    description:
      'Control de accesos para visitas y residentes mediante códigos QR dinámicos que se renuevan cada 20 segundos evitando capturas de pantalla, con validación inmediata desde caseta y notificaciones en tiempo real.',
    highlights: ['Pases QR express vía WhatsApp', 'Validación en tiempo real en caseta', 'Restricción automática de acceso a morosos'],
    gradient: 'from-blue-600/20 via-indigo-900/10 to-transparent',
    accentColor: '#2563EB',
  },
  {
    id: 'communities',
    index: '02',
    title: 'Dommia Communities',
    subtitle: 'Administración SaaS',
    category: 'Gestión Residencial',
    pillar: 'ADMIN',
    icon: Building2,
    badge: 'Núcleo Central',
    techSpec: 'POSTGRESQL 16 • MULTI-TENANT',
    description:
      'Portal web central para mesas directivas y administradores. Padrón de colonos, reservación de amenidades con validación de pagos, votaciones oficiales y comunicados.',
    highlights: ['Padrón de viviendas y residentes', 'Reservaciones con cobro integrado', 'Comunicados con acuse de lectura'],
    gradient: 'from-sky-600/20 via-blue-900/10 to-transparent',
    accentColor: '#0284C7',
  },
  {
    id: 'finance',
    index: '03',
    title: 'Dommia Finance',
    subtitle: 'Fintech & Cobranza',
    category: 'Cobranza Automatizada',
    pillar: 'ADMIN',
    icon: Wallet,
    badge: 'Próximamente',
    isUpcoming: true,
    techSpec: 'STRIPE & SPEI AUTO-SYNC',
    description:
      'Motor financiero con cálculo automático de recargos, cobro recurrente con tarjeta bancaria y conciliación directa de transferencias SPEI.',
    highlights: ['Conciliación SPEI sin intervención', 'Reportes de ingresos y egresos', 'Recibos fiscales automáticos'],
    gradient: 'from-emerald-600/20 via-emerald-900/10 to-transparent',
    accentColor: '#10B981',
  },
  {
    id: 'iot',
    index: '04',
    title: 'Dommia IoT Gateway',
    subtitle: 'Antenas RFID & Hardware',
    category: 'Infraestructura & Caseta',
    pillar: 'SECURITY',
    icon: Cpu,
    badge: 'Próximamente',
    isUpcoming: true,
    techSpec: 'RFID UHF 902-928 MHz • SQLITE LOCAL',
    description:
      'Gateways y relevadores locales para apertura vehicular automática con antenas RFID UHF de largo alcance y sincronización offline-first SQLite en caseta.',
    highlights: ['Lectura RFID UHF hasta 12 metros', 'Apertura de pluma < 0.3 segundos', 'Operación local autónoma en caseta'],
    gradient: 'from-indigo-600/20 via-indigo-900/10 to-transparent',
    accentColor: '#6366F1',
  },
  {
    id: 'resident',
    index: '05',
    title: 'Dommia Resident',
    subtitle: 'PWA & App Móvil',
    category: 'Experiencia del Colono',
    pillar: 'RESIDENTS',
    icon: Smartphone,
    badge: 'iOS & Android',
    techSpec: 'WEBPUSH • TOTP CRYPTO ENGINE',
    description:
      'Aplicación web progresiva y nativa para colonos. Generación de códigos QR para invitados, pago de cuotas en un toque, estado de cuenta y botón SOS.',
    highlights: ['Pases express para visitas', 'Pago con tarjeta o SPEI en 1 clic', 'Credencial digital del residente'],
    gradient: 'from-cyan-600/20 via-cyan-900/10 to-transparent',
    accentColor: '#06B6D4',
  },
  {
    id: 'guard',
    index: '06',
    title: 'Dommia Guard',
    subtitle: 'Terminal Táctil',
    category: 'Terminal de Caseta',
    pillar: 'SECURITY',
    icon: ShieldAlert,
    badge: 'Caseta Táctil',
    techSpec: 'TOUCH-OPTIMIZED • OFFLINE CACHE',
    description:
      'Interfaz web ultraligera diseñada para pantallas táctiles en caseta de vigilancia. Registro fotográfico de visitantes, paquetería y botón de pánico.',
    highlights: ['Escaneo instantáneo de QR y placas', 'Bitácora fotográfica de visitas', 'Botón de pánico y emergencias'],
    gradient: 'from-rose-600/20 via-rose-900/10 to-transparent',
    accentColor: '#F43F5E',
  },
  {
    id: 'analytics',
    index: '07',
    title: 'Dommia Analytics',
    subtitle: 'Business Intelligence',
    category: 'Inteligencia Operativa',
    pillar: 'ADMIN',
    icon: LineChart,
    badge: 'Tableros en Vivo',
    techSpec: 'REAL-TIME METRICS • CSV/PDF EXPORT',
    description:
      'Tableros ejecutivos en tiempo real para visualizar morosidad histórica, horas pico de afluencia vehicular y balance financiero del condominio.',
    highlights: ['Auditoría unificada de accesos', 'Proyección de cobranza anual', 'Exportación a PDF y Excel'],
    gradient: 'from-amber-600/20 via-amber-900/10 to-transparent',
    accentColor: '#F59E0B',
  },
  {
    id: 'crm',
    index: '08',
    title: 'Dommia CRM Master',
    subtitle: 'Consola Central',
    category: 'Supervisión Global',
    pillar: 'RESIDENTS',
    icon: Briefcase,
    badge: 'SuperAdmin SaaS',
    techSpec: 'SCHEMA PROVISIONING • FLEET MONITOR',
    description:
      'Panel maestro para empresas operadoras de condominios. Monitorea y aprovisiona múltiples fraccionamientos desde una sola consola centralizada.',
    highlights: ['Aprovisionamiento de esquemas SQL', 'Monitoreo global de hardware IoT', 'Control de planes y facturación'],
    gradient: 'from-purple-600/20 via-purple-900/10 to-transparent',
    accentColor: '#A855F7',
  },
];

type TabKey = 'ALL' | 'ADMIN' | 'SECURITY' | 'RESIDENTS';

interface TabItem {
  id: TabKey;
  label: string;
  count: number;
  color: string;
  glow: string;
}

const TABS: TabItem[] = [
  { id: 'ALL', label: '[ TODOS: 8 ]', count: 8, color: '#2563EB', glow: 'rgba(37, 99, 235, 0.35)' },
  { id: 'ADMIN', label: '[ ADMINISTRACIÓN & FINANZAS ]', count: 3, color: '#0284C7', glow: 'rgba(2, 132, 199, 0.35)' },
  { id: 'SECURITY', label: '[ SEGURIDAD & CASETA ]', count: 3, color: '#6366F1', glow: 'rgba(99, 102, 241, 0.35)' },
  { id: 'RESIDENTS', label: '[ RESIDENTES & MASTER CRM ]', count: 2, color: '#10B981', glow: 'rgba(16, 185, 129, 0.35)' },
];

export const ProductEcosystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const activeTabConfig = TABS.find((t) => t.id === activeTab) || TABS[0];
  const hoveredCardItem = products.find((p) => p.id === hoveredCard);
  const currentColor = hoveredCardItem ? hoveredCardItem.accentColor : activeTabConfig.color;

  const filtered = activeTab === 'ALL' ? products : products.filter((p) => p.pillar === activeTab);

  return (
    <section id="ecosistema" className="py-24 bg-slate-100/70 dark:bg-[#070D18] relative overflow-hidden border-t border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
      {/* Dynamic Liquid Ambient Background Glow that transitions colors smoothly */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[850px] h-[550px] rounded-full blur-[190px] pointer-events-none -z-10 transition-all duration-700 ease-out opacity-20 dark:opacity-25"
        style={{ backgroundColor: currentColor }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Aerolab-style Monospace Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold uppercase tracking-wider mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping" />
            <span>[ 02 // ECOSISTEMA MODULAR • 8 SOLUCIONES ]</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading mb-4 leading-tight">
            Arquitectura Modular Conectada en Tiempo Real.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Cada módulo de DOMMIA resuelve una necesidad crítica de tu fraccionamiento: desde el control de visitas en caseta hasta la contabilidad y la app del colono.
          </p>

          {/* Liquid Navbar Filter Bar */}
          <div className="relative inline-flex items-center justify-center p-1.5 mt-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none transition-all duration-300">
            {/* Ambient liquid glow behind active filter button */}
            <div 
              className="absolute inset-0 rounded-2xl transition-all duration-500 pointer-events-none opacity-30 blur-md"
              style={{ background: `radial-gradient(circle at center, ${activeTabConfig.color}, transparent 70%)` }}
            />

            <div className="relative z-10 flex flex-wrap items-center justify-center gap-1.5">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={
                      isActive
                        ? {
                            backgroundColor: tab.color,
                            boxShadow: `0 8px 20px -4px ${tab.glow}`,
                          }
                        : undefined
                    }
                    className={`relative px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 8-Card Balanced Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((item) => {
            const Icon = item.icon;
            const isHovered = hoveredCard === item.id;

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredCard(item.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={
                  isHovered
                    ? {
                        borderColor: item.accentColor,
                        boxShadow: `0 14px 30px -10px ${item.accentColor}30`,
                      }
                    : undefined
                }
                className="p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group relative overflow-hidden shadow-sm"
              >
                {/* Dynamic Liquid Hover Glow on the Card */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-b ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} 
                />

                <div className="relative z-10 space-y-4">
                  {/* Monospace index & badge */}
                  <div className="flex items-center justify-between text-xs font-mono pb-3 border-b border-slate-200 dark:border-slate-800/80">
                    <span className="font-bold text-slate-500 dark:text-slate-400">
                      [ {item.index} ]
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                        item.isUpcoming
                          ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/80'
                          : 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/80'
                      }`}
                    >
                      {item.isUpcoming && <Lock className="w-2.5 h-2.5" />}
                      {item.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div 
                      className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all duration-300 group-hover:scale-105 shadow-xs shrink-0"
                      style={isHovered ? { backgroundColor: item.accentColor, color: '#FFFFFF', borderColor: item.accentColor } : undefined}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                        {item.category}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white font-heading leading-snug">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  {/* Monospace Technical Specification Tag */}
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800/70">
                    {item.techSpec}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="relative z-10 mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                  {item.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
