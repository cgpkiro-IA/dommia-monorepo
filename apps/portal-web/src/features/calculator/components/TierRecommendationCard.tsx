'use client';

import React from 'react';
import { CheckCircle, Shield } from 'lucide-react';
import { TierInfo } from '../../../types';

interface TierRecommendationCardProps {
  tierInfo: TierInfo;
}

export const TierRecommendationCard: React.FC<TierRecommendationCardProps> = ({ tierInfo }) => {
  const IconComponent = tierInfo.icon;

  return (
    <div className={`lg:col-span-7 p-6 sm:p-8 rounded-2xl border ${tierInfo.color} shadow-2xl transition-all duration-300`}>
      {/* Tier Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <IconComponent className="w-6 h-6" />
          </div>
          <div>
            <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider mb-1 ${tierInfo.accentBadge}`}>
              {tierInfo.badge}
            </span>
            <h3 className="text-2xl font-black text-white font-heading">
              {tierInfo.name}
            </h3>
          </div>
        </div>
      </div>

      <p className="text-slate-300 text-sm mt-4 mb-6 leading-relaxed">
        {tierInfo.summary}
      </p>

      {/* Feature Checklist */}
      <div className="space-y-3 mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Capacidades y Módulos Activos en este Nivel:
        </p>
        {tierInfo.features.map((feat, idx) => (
          <div key={idx} className="flex items-start gap-3 text-sm text-slate-200">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{feat}</span>
          </div>
        ))}
      </div>

      {/* Security Banner */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3 text-xs text-slate-300">
        <Shield className="w-5 h-5 text-blue-400 shrink-0" />
        <span>
          <strong>Garantía DOMMIA:</strong> Base de datos aislada por fraccionamiento y compatibilidad con hardware UHF universal.
        </span>
      </div>
    </div>
  );
};
