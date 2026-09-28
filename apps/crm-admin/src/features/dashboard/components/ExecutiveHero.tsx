'use client';

import React from 'react';
import { Building2, Sparkles } from 'lucide-react';

export function ExecutiveHero() {
  return (
    <div className="bg-gradient-to-r from-[#0F172A] via-slate-900 to-[#1E3A8A] rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
      <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
        <Building2 className="w-80 h-80" />
      </div>
      <div className="relative z-10 max-w-2xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-500/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SaaS Dommia • Indicadores en Tiempo Real</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-heading">
          Control Central del Negocio Dommia
        </h1>
        <p className="text-slate-300 text-sm md:text-base leading-relaxed">
          Monitoreo de ingresos recurrentes (MRR), retención de clientes, comunidades operativas y telemetría de casetas IoT tolerantes a fallos.
        </p>
      </div>
    </div>
  );
}
