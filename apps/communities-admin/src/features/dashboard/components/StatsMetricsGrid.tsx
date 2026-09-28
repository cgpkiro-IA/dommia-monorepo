'use client';

import React from 'react';
import { Home, Users, Car, DollarSign } from 'lucide-react';
import { Metrics } from '@/types';
import { AdminTab } from './TabNavigation';

interface StatsMetricsGridProps {
  metrics: Metrics | null;
  residentsCount: number;
  vehiclesCount: number;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onFilterDelinquent: () => void;
}


export function StatsMetricsGrid({
  metrics,
  residentsCount,
  vehiclesCount,
  activeTab,
  onTabChange,
  onFilterDelinquent,
}: StatsMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Viviendas */}
      <div
        onClick={() => onTabChange('PROPERTIES')}
        className={`p-5 rounded-2xl border transition-all cursor-pointer ${
          activeTab === 'PROPERTIES'
            ? 'bg-blue-50/60 border-blue-400 shadow-sm'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Viviendas
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Home className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-black text-slate-900 font-heading">
          {metrics?.total ?? 0}
        </div>
        <span className="text-[11px] text-slate-500">
          {metrics?.remaining ?? 0} cupos libres de {metrics?.maxAllowed}
        </span>
      </div>

      {/* 2. Padrón Residentes */}
      <div
        onClick={() => onTabChange('RESIDENTS')}
        className={`p-5 rounded-2xl border transition-all cursor-pointer ${
          activeTab === 'RESIDENTS'
            ? 'bg-indigo-50/60 border-indigo-400 shadow-sm'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Padrón Residentes
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-black text-indigo-600 font-heading">
          {metrics?.totalResidents ?? residentsCount}
        </div>
        <span className="text-[11px] text-slate-500">
          {metrics?.ownersCount ?? 0} propietarios • {metrics?.tenantsCount ?? 0} inquilinos
        </span>
      </div>

      {/* 3. Control Vehicular */}
      <div
        onClick={() => onTabChange('VEHICLES')}
        className={`p-5 rounded-2xl border transition-all cursor-pointer ${
          activeTab === 'VEHICLES'
            ? 'bg-emerald-50/60 border-emerald-400 shadow-sm'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Control Vehicular
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Car className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-black text-emerald-600 font-heading">
          {metrics?.totalVehicles ?? vehiclesCount}
        </div>
        <span className="text-[11px] text-slate-500">
          Autos y TAGs RFID vinculados
        </span>
      </div>

      {/* 4. Finanzas & Cobranza */}
      <div
        onClick={() => onTabChange('FINANCE')}
        className={`p-5 rounded-2xl border transition-all cursor-pointer ${
          activeTab === 'FINANCE'
            ? 'bg-emerald-50/70 border-emerald-400 shadow-sm'
            : 'bg-white border-slate-200 hover:border-emerald-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Finanzas & Cobranza
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-black text-slate-900 font-heading">
          {metrics?.delinquentCount === 0 ? 'Al Corriente' : `${metrics?.delinquentCount} Morosos`}
        </div>
        <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
          Cortes, cuotas y ventanilla ›
        </span>
      </div>
    </div>
  );
}
