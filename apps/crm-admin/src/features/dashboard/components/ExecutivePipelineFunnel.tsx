'use client';

import React from 'react';
import { Button } from '@dommia/ui';
import { ArrowRight } from 'lucide-react';
import { MetricsData, STAGES } from '../../../types';

interface ExecutivePipelineFunnelProps {
  metrics: MetricsData | null;
  onViewPipeline: () => void;
}

export function ExecutivePipelineFunnel({
  metrics,
  onViewPipeline,
}: ExecutivePipelineFunnelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Funnel Progress Summary */}
      <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-heading">
              Salud del Pipeline Comercial
            </h2>
            <p className="text-xs text-slate-500">
              Prospectos activos captados en la Landing Comercial o ingresados por el equipo
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onViewPipeline}
            className="text-xs"
          >
            Ver Tablero Kanban
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          {STAGES.map((s) => {
            const funnel = metrics?.pipeline?.funnel || (metrics as any)?.pipeline?.stages || {};
            const count = funnel[s.key] || 0;
            return (
              <div key={s.key} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-xs font-semibold text-slate-500 block truncate">
                  {s.label.split(' ')[0]}
                </span>
                <span className="text-2xl font-black text-slate-900 font-heading mt-1 block">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier Distribution Widget */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 font-heading mb-1">
            Distribución de Tiers
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Comunidades activas por paquete
          </p>

          {(() => {
            const tierBreakdown = metrics?.financials?.tierBreakdown || {};
            return (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Básico ($1,490):</span>
                  <span className="font-bold text-slate-900">{tierBreakdown.BASIC || 0}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Estándar ($2,990):</span>
                  <span className="font-bold text-slate-900">{tierBreakdown.STANDARD || 0}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Profesional ($4,990):</span>
                  <span className="font-bold text-slate-900">{tierBreakdown.PROFESSIONAL || 0}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Enterprise ($8,990):</span>
                  <span className="font-bold text-slate-900">{tierBreakdown.ENTERPRISE || 0}</span>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
          <span className="text-slate-500">Moneda Oficial:</span>
          <span className="font-bold text-blue-600">Pesos Mexicanos (MXN)</span>
        </div>
      </div>
    </div>
  );
}
