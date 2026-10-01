'use client';

import React from 'react';
import { 
  Radio, 
  CreditCard, 
  Car,
  HardDrive,
  Lock,
  ChevronRight,
  Sliders
} from 'lucide-react';
import { Button, Badge } from '@dommia/ui';
import { LiquidFeatureCards } from './LiquidFeatureCards';

export const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden bg-gradient-to-b from-slate-100/80 via-white to-slate-50 dark:from-[#070D18] dark:via-[#0B1120] dark:to-[#070D18] transition-colors duration-200">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-blue-400/20 via-indigo-500/15 to-transparent dark:from-blue-600/20 dark:via-indigo-600/15 dark:to-transparent rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/6 w-[400px] h-[400px] bg-cyan-400/15 dark:bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/6 w-[450px] h-[450px] bg-blue-500/10 dark:bg-blue-700/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      
      {/* Subtle geometric dot grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04] pointer-events-none -z-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #2563EB 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide uppercase mb-8 shadow-sm shadow-blue-500/10 dark:shadow-blue-950/50 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
            <span>DOMUS + TECNOLOGÍA • EL SISTEMA OPERATIVO DE TU COMUNIDAD</span>
          </div>

          {/* Main Title (H1) */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6 font-heading">
            Gestión Inteligente.{' '}
            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-400 dark:via-blue-500 dark:to-cyan-400 bg-clip-text text-transparent block sm:inline">
              Control Total.
            </span>{' '}
            Cero Complicaciones.
          </h1>

          {/* Elevator Pitch & Value Proposition */}
          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed mb-10 max-w-3xl mx-auto">
            <strong className="text-slate-900 dark:text-white font-semibold">DOMMIA</strong> conecta administración vecinal, cobranza bancaria automatizada con Stripe, control de acceso vehicular RFID de alta velocidad y app comunitaria con{' '}
            <span className="text-blue-600 dark:text-blue-300 font-medium underline decoration-blue-400/50 underline-offset-4">
              arquitectura tolerante a fallos de internet en caseta
            </span>.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a href="#cotizador" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-xl shadow-blue-600/30">
                <Sliders className="w-5 h-5 mr-2" />
                <span>Cotizador Dinámico de Tiers</span>
              </Button>
            </a>

            <a href="#contacto" className="w-full sm:w-auto">
              <Button variant="dark-outline" size="lg" className="w-full sm:w-auto">
                <span>Solicitar Demostración con Asesor</span>
                <ChevronRight className="w-4 h-4 ml-1.5 text-blue-500 dark:text-blue-400" />
              </Button>
            </a>
          </div>

          {/* Liquid Feature Cards (4 Pillars with Liquid color-shifting glow) */}
          <LiquidFeatureCards />
        </div>

        {/* Live Interface Preview Mockup */}
        <div className="mt-16 max-w-5xl mx-auto rounded-3xl p-1 bg-gradient-to-b from-blue-400/40 via-slate-200/60 to-slate-100 dark:from-blue-500/30 dark:via-slate-800/40 dark:to-slate-950/90 shadow-2xl shadow-blue-600/10 dark:shadow-blue-950/60">
          <div className="bg-white dark:bg-[#0B1120] rounded-[22px] p-4 sm:p-6 border border-slate-200 dark:border-slate-800/90 shadow-xl">
            {/* Window chrome header */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-slate-800/90 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-[11px] text-slate-600 dark:text-slate-400 hidden sm:inline">
                  https://bosques.dommia.com — Dommia Communities
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm" dot={true} pulse={true}>
                  Gateway Caseta Principal: ONLINE
                </Badge>
              </div>
            </div>

            {/* Dashboard Mock Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Live RFID Detection */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-blue-500" />
                    Último Acceso Vehicular
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">En vivo</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Car className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">Carlos Mendoza (Casa 101)</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">Mazda CX-5 • TAG-8821</p>
                  </div>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Estado: Al corriente</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-bold text-[10px]">
                    PLUMA ABIERTA
                  </span>
                </div>
              </div>

              {/* Card 2: Financial Health */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Recaudación Mensual
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">96.4%</span>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white font-heading mb-1.5">$142,500 MXN</p>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-emerald-500 h-2 rounded-full" style={{ width: '96.4%' }} />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>95 de 98 casas al corriente</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Stripe / SPEI</span>
                </p>
              </div>

              {/* Card 3: Offline Gateway Status */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    Tolerancia a Red
                  </span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-mono text-[11px]">SQLite Local</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>Base de datos en caseta:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Sincronizada</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>Lista blanca RFID:</span>
                    <span className="text-slate-900 dark:text-white font-mono">198 Tags</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>Corte de fibra óptica:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">Cero demoras</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
