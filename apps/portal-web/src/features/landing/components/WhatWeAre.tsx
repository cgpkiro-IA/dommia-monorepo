'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  XCircle, 
  CheckCircle2, 
  Shield, 
  HeartHandshake, 
  Zap, 
  Scale, 
  Sparkles,
  TrendingUp,
  Layers
} from 'lucide-react';

const values = [
  {
    icon: Shield,
    title: 'Confianza',
    description: 'Bases de datos aisladas por fraccionamiento. Tu información financiera y de accesos está blindada.',
  },
  {
    icon: Scale,
    title: 'Transparencia',
    description: 'Mesas directivas y colonos tienen acceso en tiempo real a estados de cuenta y bitácoras de visitas.',
  },
  {
    icon: Zap,
    title: 'Innovación Práctica',
    description: 'Tecnología offline-first con SQLite local que resuelve los problemas reales de caseta e internet en México.',
  },
  {
    icon: HeartHandshake,
    title: 'Comunidad',
    description: 'Herramientas diseñadas para fomentar la convivencia, votaciones democráticas y resolución ágil de incidencias.',
  },
  {
    icon: TrendingUp,
    title: 'Escalabilidad',
    description: 'Desde una privada de 20 casas hasta macro-desarrollos de más de 1,000 unidades con múltiples accesos.',
  },
];

export const WhatWeAre: React.FC = () => {
  const comparisonRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const [comparisonRevealed, setComparisonRevealed] = useState(false);
  const [valuesRevealed, setValuesRevealed] = useState(false);

  useEffect(() => {
    const comparison = comparisonRef.current;
    const valuesGrid = valuesRef.current;
    if (!comparison || !valuesGrid || !('IntersectionObserver' in window)) {
      setComparisonRevealed(true);
      setValuesRevealed(true);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (entry.target === comparison) setComparisonRevealed(true);
        if (entry.target === valuesGrid) setValuesRevealed(true);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    observer.observe(comparison);
    observer.observe(valuesGrid);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="filosofia" className="philosophy-section py-24 bg-slate-50 dark:bg-[#070D18] relative border-t border-slate-200 dark:border-slate-800/80 overflow-hidden transition-colors duration-200">
      {/* Background glow */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nuestra Filosofía y Posicionamiento</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading mb-4">
            No somos un parche. Somos el Sistema Operativo.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
            La mayoría de los fraccionamientos operan con herramientas aisladas que no se comunican entre sí. En DOMMIA integramos administración, finanzas y hardware en una sola experiencia fluida.
          </p>
        </div>

        {/* Comparison Grid */}
        <div
          ref={comparisonRef}
          className={`philosophy-comparison grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20${comparisonRevealed ? ' is-revealed' : ''}`}
        >
          {/* Lo que NO somos */}
          <div className="philosophy-comparison-card philosophy-comparison-card--fragmented p-8 rounded-3xl bg-rose-50/80 dark:bg-rose-950/15 border border-rose-200 dark:border-rose-500/25 shadow-lg shadow-rose-950/5 relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="philosophy-kicker philosophy-kicker--negative text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                  El Modelo Tradicional Fragmentado
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-heading">
                  Lo que NO somos
                </h3>
              </div>
            </div>

            <ul className="philosophy-points space-y-4">
              <li className="flex items-start gap-3 text-slate-700 dark:text-slate-300 text-sm">
                <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong>No somos solo un sistema de plumas:</strong> Que deja de responder o colapsa el tráfico vehicular cuando se corta el internet.
                </span>
              </li>
              <li className="flex items-start gap-3 text-slate-700 dark:text-slate-300 text-sm">
                <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong>No somos un software aislado de acceso:</strong> Desconectado de la cobranza y del estado de cuenta de los residentes.
                </span>
              </li>
              <li className="flex items-start gap-3 text-slate-700 dark:text-slate-300 text-sm">
                <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong>No somos una app genérica pesada:</strong> Que los colonos evitan instalar porque consume espacio y requiere procesos lentos.
                </span>
              </li>
              <li className="flex items-start gap-3 text-slate-700 dark:text-slate-300 text-sm">
                <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong>No somos un sistema administrativo arcaico:</strong> Con tablas estáticas y procesos burocráticos difíciles de auditar.
                </span>
              </li>
            </ul>
          </div>

          {/* Lo que SOMOS */}
          <div className="philosophy-comparison-card philosophy-comparison-card--unified p-8 rounded-3xl bg-blue-50/80 dark:bg-blue-950/25 border border-blue-200 dark:border-blue-500/35 shadow-xl shadow-blue-950/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="philosophy-kicker philosophy-kicker--positive text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  La Plataforma Operativa Integral
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-heading">
                  Lo que SOMOS
                </h3>
              </div>
            </div>

            <ul className="philosophy-points space-y-4">
              <li className="flex items-start gap-3 text-slate-800 dark:text-slate-200 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>La plataforma operativa unificada:</strong> Sincroniza en tiempo real caseta, transferencias SPEI, plumas vehiculares y residentes.
                </span>
              </li>
              <li className="flex items-start gap-3 text-slate-800 dark:text-slate-200 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Arquitectura Offline-First real:</strong> Respaldada por gateways con base de datos SQLite local para garantizar apertura de plumas 24/7.
                </span>
              </li>
              <li className="flex items-start gap-3 text-slate-800 dark:text-slate-200 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>App PWA y Móvil Nativa:</strong> Pases QR instantáneos compartibles por WhatsApp, botón de pánico y pago de mantenimiento en 1 clic.
                </span>
              </li>
              <li className="flex items-start gap-3 text-slate-800 dark:text-slate-200 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Multi-Tenancy estricto:</strong> Máxima privacidad donde cada comunidad opera en su propio esquema de datos independiente.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* 5 Core Brand Values */}
        <div className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-800/80">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-heading">
              Los Valores que Guían Cada Línea de Código
            </h3>
          </div>

          <div
            ref={valuesRef}
            className={`philosophy-values-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4${valuesRevealed ? ' is-revealed' : ''}`}
          >
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div
                  key={i}
                  className="philosophy-value-card p-5 rounded-2xl bg-white/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-xs"
                  style={{ animationDelay: `${i * 55}ms` }}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading">{v.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{v.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
