'use client';

import React from 'react';
import { CheckCircle2, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { TierInfo } from '../../../types';

const fireworkOrigins = [
  { left: '9%', top: '12%', delay: 0 },
  { left: '91%', top: '13%', delay: 140 },
  { left: '88%', top: '86%', delay: 280 },
];
const sparkColors = ['#b55cff', '#51a7ff', '#42dca9', '#ffc45f'];

interface TierRecommendationCardProps {
  tierInfo: TierInfo;
}

export const TierRecommendationCard: React.FC<TierRecommendationCardProps> = ({ tierInfo }) => {
  const IconComponent = tierInfo.icon;
  const isEnterprise = tierInfo.key === 'ENTERPRISE';

  return (
    <div data-tier={tierInfo.key.toLowerCase()} className={`calculator-plan-card lg:col-span-7 p-7 sm:p-9 rounded-3xl border ${tierInfo.color} bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl dark:shadow-2xl relative overflow-hidden flex flex-col justify-between`}>
      <div className="calculator-plan-aura absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {isEnterprise && (
        <div className="enterprise-fireworks" aria-hidden="true">
          {fireworkOrigins.map((origin, burstIndex) => (
            <span key={`${origin.left}-${origin.top}`} className="enterprise-firework-burst" style={{ left: origin.left, top: origin.top }}>
              {Array.from({ length: 12 }, (_, sparkIndex) => {
                const angle = (Math.PI * 2 * sparkIndex) / 12;
                const distance = 28 + (sparkIndex % 3) * 8;
                return (
                  <i
                    key={sparkIndex}
                    className="enterprise-firework-spark"
                    style={{
                      '--spark-x': `${Math.cos(angle) * distance}px`,
                      '--spark-y': `${Math.sin(angle) * distance}px`,
                      '--spark-color': sparkColors[(sparkIndex + burstIndex) % sparkColors.length],
                      '--spark-delay': `${origin.delay}ms`,
                    } as React.CSSProperties}
                  />
                );
              })}
            </span>
          ))}
        </div>
      )}

      <div className="calculator-plan-content">
        {/* Tier Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="calculator-plan-icon w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 dark:from-blue-600/30 dark:to-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-500/30 shadow-md">
              <IconComponent className="w-7 h-7" />
            </div>
            <div>
              <span className={`calculator-tier-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider mb-1.5 ${tierInfo.accentBadge}`}>
                <Zap className="w-3 h-3" />
                <span>{tierInfo.badge}</span>
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading tracking-tight">
                {tierInfo.name}
              </h3>
            </div>
          </div>
        </div>

        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mt-5 mb-7 leading-relaxed">
          {tierInfo.summary}
        </p>

        {isEnterprise && (
          <div className="enterprise-benefit mb-7 flex items-center gap-3 rounded-2xl border p-4 sm:p-5">
            <div className="enterprise-benefit-icon grid h-11 w-11 shrink-0 place-items-center rounded-xl">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="enterprise-benefit-kicker block text-[10px] font-black uppercase tracking-wider">Ventaja exclusiva Enterprise</span>
              <strong className="enterprise-benefit-title mt-0.5 block text-sm sm:text-base">Dominio personalizado incluido</strong>
              <span className="enterprise-benefit-saving mt-0.5 block text-xs font-semibold">Ahorra $490 MXN/mes frente al add-on estándar</span>
            </div>
          </div>
        )}

        {/* Feature Checklist */}
        <div className="space-y-3.5 mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 font-heading">
            Capacidades y Módulos Activos en este Nivel:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tierInfo.features.map((feat, idx) => (
              <div key={idx} className="calculator-feature-item flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-xs" style={{ animationDelay: `${idx * 45}ms` }}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Banner */}
      <div className="calculator-security-banner p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 shadow-inner">
        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-500/20">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <span>
          <strong className="text-slate-900 dark:text-white">Garantía DOMMIA:</strong> Base de datos aislada por fraccionamiento, cifrado AES y compatibilidad garantizada con lectores RFID UHF y código QR dinámico.
        </span>
      </div>
    </div>
  );
};
