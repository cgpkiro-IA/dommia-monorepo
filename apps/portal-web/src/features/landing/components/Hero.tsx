'use client';
import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  ArrowRight, 
  CheckCircle2, 
  Sliders, 
  Radio, 
  CreditCard, 
  Users, 
  Lock 
} from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      {/* Background Gradients & Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-blue-600/15 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      {/* Subtle grid pattern background */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '36px 36px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-semibold tracking-wide uppercase mb-8 shadow-inner shadow-blue-500/10">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>El Sistema Operativo de tu Comunidad Residencial</span>
          </div>

          {/* Main Title (H1) */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6 font-heading">
            Gestión Inteligente.{' '}
            <span className="text-gradient-blue block sm:inline">
              Control Total.
            </span>{' '}
            Cero Complicaciones.
          </h1>

          {/* Elevator Pitch & Value Proposition */}
          <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed mb-10 max-w-3xl mx-auto">
            <strong className="text-white font-semibold">DOMMIA</strong> conecta administración, finanzas, control de acceso vehicular RFID y aplicación comunitaria en una sola plataforma unificada con{' '}
            <span className="text-blue-400 font-medium">arquitectura tolerante a fallos de internet</span>.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="#cotizador"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/30 hover:shadow-blue-500/50 transition-all hover:-translate-y-0.5"
            >
              <Sliders className="w-5 h-5" />
              <span>Cotizador Interactivo de Tiers</span>
            </a>
            <a
              href="#contacto"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700/80 transition-all hover:text-white"
            >
              <span>Solicitar Demostración</span>
              <ArrowRight className="w-4 h-4 text-blue-400" />
            </a>
          </div>

          {/* Micro Value Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-slate-800/80 text-left">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase mb-1">
                <Radio className="w-3.5 h-3.5" />
                <span>Offline-First</span>
              </div>
              <p className="text-2xl font-extrabold text-white font-heading">100%</p>
              <p className="text-xs text-slate-400 mt-0.5">Operativo aún sin internet en caseta</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase mb-1">
                <Cpu className="w-3.5 h-3.5" />
                <span>Acceso Vehicular</span>
              </div>
              <p className="text-2xl font-extrabold text-white font-heading">&lt; 0.3s</p>
              <p className="text-xs text-slate-400 mt-0.5">Lectura RFID UHF y apertura de pluma</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase mb-1">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Cobranza Segura</span>
              </div>
              <p className="text-2xl font-extrabold text-white font-heading">Auto-Sync</p>
              <p className="text-xs text-slate-400 mt-0.5">Conciliación con Stripe y SPEI bancario</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Multi-Inquilino</span>
              </div>
              <p className="text-2xl font-extrabold text-white font-heading">Aislamiento</p>
              <p className="text-xs text-slate-400 mt-0.5">PostgreSQL Schemas independientes</p>
            </div>
          </div>
        </div>

        {/* Live Interface Preview Mockup */}
        <div className="mt-14 max-w-5xl mx-auto rounded-2xl p-1 bg-gradient-to-b from-blue-500/30 via-slate-800/40 to-slate-900/80 shadow-2xl shadow-blue-950/50">
          <div className="bg-[#0F172A] rounded-[15px] p-4 sm:p-6 border border-slate-800">
            {/* Window chrome header */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-[11px] text-slate-400 hidden sm:inline">
                  https://laspalmas.dommia.com — Dommia Communities
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-medium text-[11px] border border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Gateway Caseta Norte: ONLINE
                </span>
              </div>
            </div>

            {/* Dashboard Mock Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Live RFID Detection */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span className="font-semibold text-slate-200">Último Acceso Vehicular</span>
                  <span className="text-emerald-400 font-mono">12:38:15</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                    🚗
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Carlos Mendoza (Casa 101)</p>
                    <p className="text-xs text-slate-400">Mazda CX-5 • TAG-UHF-8821</p>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Estado: Al corriente</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    PLUMA ABIERTA
                  </span>
                </div>
              </div>

              {/* Card 2: Financial Health */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-semibold text-slate-200">Cobranza del Mes</span>
                  <span className="text-emerald-400 font-bold">96.4%</span>
                </div>
                <p className="text-xl font-extrabold text-white font-heading mb-1">$142,500 MXN</p>
                <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '96.4%' }} />
                </div>
                <p className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>95 de 98 casas al corriente</span>
                  <span className="text-blue-400 font-medium">Stripe / SPEI</span>
                </p>
              </div>

              {/* Card 3: Offline Gateway Status */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-semibold text-slate-200">Tolerancia a Red</span>
                  <span className="text-blue-400 font-mono">SQLite Local</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Base de datos en caseta:</span>
                    <span className="text-emerald-400 font-semibold">Sincronizada</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Lista blanca RFID:</span>
                    <span className="text-white font-mono">198 Tags</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Corte de fibra óptica:</span>
                    <span className="text-blue-400 font-semibold">Cero demoras</span>
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
