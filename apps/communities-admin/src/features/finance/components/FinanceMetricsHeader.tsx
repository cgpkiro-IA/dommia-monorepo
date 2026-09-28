'use client';

import React from 'react';
import { DollarSign, Clock, CheckCircle2, Layers } from 'lucide-react';
import { FinancialSummaryData } from '@/types';

interface FinanceMetricsHeaderProps {
  summary: FinancialSummaryData | null;
  activeFeesCount: number;
  totalFeesCount: number;
}

export function FinanceMetricsHeader({
  summary,
  activeFeesCount,
  totalFeesCount,
}: FinanceMetricsHeaderProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-slate-400">Recaudado este Mes</span>
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <span className="text-2xl font-black text-slate-900 font-heading mt-1.5 block">
          ${Number(summary?.totalCollectedMonth || 0).toLocaleString('es-MX', {
            minimumFractionDigits: 2,
          })}
        </span>
        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
          <span>💵 Efectivo: ${Number(summary?.cashCollected || 0).toLocaleString('es-MX')}</span>
          <span>•</span>
          <span>🏦 SPEI: ${Number(summary?.speiCollected || 0).toLocaleString('es-MX')}</span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-slate-400">Pendiente por Cobrar</span>
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <span className="text-2xl font-black text-slate-900 font-heading mt-1.5 block">
          ${Number(summary?.totalPendingAmount || 0).toLocaleString('es-MX', {
            minimumFractionDigits: 2,
          })}
        </span>
        <span className="text-[10px] text-slate-500 block mt-1">
          Saldo acumulado por liquidar
        </span>
      </div>

      <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-slate-400">Padrón de Viviendas</span>
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-1.5">
          <span className="text-2xl font-black text-emerald-600 font-heading">
            {summary?.upToDatePropertiesCount || 0}
          </span>
          <span className="text-xs text-slate-400 font-medium">al corriente</span>
        </div>
        <span className="text-[10px] text-rose-600 font-medium block mt-1">
          {summary?.delinquentPropertiesCount || 0} en morosidad
        </span>
      </div>

      <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-slate-400">Estructuras Activas</span>
          <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <span className="text-2xl font-black text-slate-900 font-heading mt-1.5 block">
          {activeFeesCount}
        </span>
        <span className="text-[10px] text-purple-700 font-medium block mt-1">
          {totalFeesCount} cuotas en catálogo
        </span>
      </div>
    </div>
  );
}
