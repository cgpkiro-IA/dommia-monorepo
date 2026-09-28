'use client';

import React from 'react';
import { AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { Metrics, TenantMetadata } from '@/types';

interface CapacityHeroBannerProps {
  metrics: Metrics | null;
  activeTenant: TenantMetadata | null;
  onOpenUpgradeModal: () => void;
}

export function CapacityHeroBanner({
  metrics,
  activeTenant,
  onOpenUpgradeModal,
}: CapacityHeroBannerProps) {
  if (!metrics) return null;

  return (
    <div
      className={`p-6 rounded-3xl border shadow-sm transition-all ${
        metrics.isLimitReached
          ? 'bg-red-950/10 border-red-300 bg-gradient-to-r from-red-50 to-orange-50'
          : metrics.usagePercentage >= 80
          ? 'bg-amber-50 border-amber-300'
          : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2.5">
            {metrics.isLimitReached ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Límite Duro Alcanzado (100%)</span>
              </span>
            ) : metrics.usagePercentage >= 80 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Capacidad Próxima al Límite</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Capacidad Operativa Normal</span>
              </span>
            )}

            <span className="text-xs text-slate-500 font-medium">
              Paquete Contratado: <strong>{activeTenant?.tier}</strong> ({metrics.maxAllowed} casas max)
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 font-heading">
            {metrics.isLimitReached ? (
              <span className="text-red-700">
                Capacidad Máxima Completada: {metrics.total} de {metrics.maxAllowed} viviendas
              </span>
            ) : (
              <span>
                {metrics.total} de {metrics.maxAllowed} viviendas registradas ({metrics.usagePercentage}%)
              </span>
            )}
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed">
            {metrics.isLimitReached ? (
              <span>
                Has alcanzado el límite estricto de tu paquete SaaS. Para dar de alta más casas o condominios, solicita un <strong>Upgrade de Plan</strong> de manera inmediata en Dommia CRM.
              </span>
            ) : (
              <span>
                Cuentas con <strong>{metrics.remaining} espacios disponibles</strong> para dar de alta nuevas casas antes de alcanzar el límite del plan.
              </span>
            )}
          </p>
        </div>

        {/* Progress Bar & Upgrade CTA */}
        <div className="w-full lg:w-80 space-y-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-600">Ocupación de Licencias:</span>
            <span
              className={
                metrics.isLimitReached
                  ? 'text-red-600 font-black'
                  : metrics.usagePercentage >= 80
                  ? 'text-amber-600 font-black'
                  : 'text-blue-600 font-black'
              }
            >
              {metrics.usagePercentage}%
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden shadow-inner">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                metrics.isLimitReached
                  ? 'bg-red-600'
                  : metrics.usagePercentage >= 80
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(100, metrics.usagePercentage)}%` }}
            />
          </div>

          <button
            type="button"
            onClick={onOpenUpgradeModal}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
              metrics.isLimitReached
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Solicitar Upgrade de Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
