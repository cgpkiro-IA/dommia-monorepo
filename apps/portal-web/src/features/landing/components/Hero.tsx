'use client';

import React from 'react';
import { 
  CreditCard, 
  Car,
  HardDrive,
  Lock,
  ChevronRight,
  Sliders
} from 'lucide-react';
import { Button, Badge } from '@dommia/ui';
import { LiquidFeatureCards } from './LiquidFeatureCards';
import { ConnectedCommunityScene } from './ConnectedCommunityScene';
import { DEMO_MAILTO } from '../../../lib/contact-email';

export const Hero: React.FC = () => {
  return (
    <section className="hero-landing relative pt-28 pb-16 md:pt-32 md:pb-20 overflow-hidden bg-gradient-to-b from-slate-100/80 via-white to-slate-50 dark:from-[#070D18] dark:via-[#0B1120] dark:to-[#070D18] transition-colors duration-200">
      <div className="hero-atmosphere absolute inset-0 pointer-events-none -z-10" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="hero-intro-grid grid items-center gap-5 md:grid-cols-[0.95fr_1.05fr] md:gap-3 lg:gap-8">
          <div className="hero-copy mx-auto max-w-2xl text-center md:mx-0 md:text-left">
            <div className="hero-eyebrow inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide uppercase mb-7 shadow-sm shadow-blue-500/10 dark:shadow-blue-950/50 backdrop-blur-md">
              <span className="hero-live-dot flex h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              <span>El sistema operativo de tu comunidad</span>
            </div>

            <h1 className="hero-title text-4xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.04] mb-6 font-heading">
              <span className="block">Gestión inteligente.</span>
              <span className="hero-title-accent block">Control total.</span>
              <span className="block">Cero complicaciones.</span>
            </h1>

            <p className="hero-description text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal leading-relaxed mb-8 max-w-xl mx-auto md:mx-0">
              <strong className="text-slate-900 dark:text-white font-semibold">DOMMIA</strong> conecta administración, finanzas, accesos vehiculares y experiencia residencial en una plataforma confiable, incluso cuando falla internet en caseta.
            </p>

            <div className="hero-actions flex flex-col items-center justify-center gap-3 min-[640px]:flex-row md:justify-start xl:items-start">
              <a href="#cotizador" className="w-full min-[640px]:w-auto">
                <Button variant="primary" size="lg" className="hero-primary-cta w-full min-[640px]:w-auto shadow-xl shadow-blue-600/30">
                  <Sliders className="w-5 h-5 mr-2" />
                  <span>Cotizador Dinámico de Tiers</span>
                </Button>
              </a>

              <a href={process.env.NEXT_PUBLIC_PORTAL_STATIC_MODE === '1' ? DEMO_MAILTO : '#contacto'} className="w-full min-[640px]:w-auto">
                <Button variant="dark-outline" size="lg" className="hero-secondary-cta w-full min-[640px]:w-auto">
                  <span>Solicitar Demostración</span>
                  <ChevronRight className="w-4 h-4 ml-1.5 text-blue-500 dark:text-blue-400" />
                </Button>
              </a>
            </div>
          </div>

          <div className="hero-visual relative mx-auto w-full max-w-[680px]">
            <div className="hero-visual-halo absolute inset-0 pointer-events-none" />
            <ConnectedCommunityScene />
          </div>
        </div>

        <div className="hero-benefits mt-7 md:mt-2">
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
                  https://bosques.dommia.com.mx — Dommia Communities
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
