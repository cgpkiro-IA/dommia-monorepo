'use client';

import React from 'react';
import { Card } from '@dommia/ui';
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Home,
  Activity,
  Radio,
} from 'lucide-react';
import { MetricsData } from '../../../types';

interface ExecutiveMetricsGridProps {
  metrics: MetricsData | null;
}

export function ExecutiveMetricsGrid({ metrics }: ExecutiveMetricsGridProps) {
  const mrr = metrics?.financials?.mrr ?? (metrics as any)?.finances?.mrr ?? 0;
  const arr = metrics?.financials?.arr ?? (metrics as any)?.finances?.arr ?? 0;
  const activeTenants = metrics?.communities?.activeTenants ?? (metrics as any)?.activeTenants ?? 0;
  const totalHouses = metrics?.communities?.totalHouses ?? 0;
  const churnRate = metrics?.financials?.churnRate ?? 0;
  const onlineGateways = metrics?.iot?.onlineGateways ?? (metrics as any)?.onlineGateways ?? 0;
  const totalGateways = metrics?.iot?.totalGateways ?? (metrics as any)?.onlineGateways ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* MRR Card */}
      <Card elevation="hover" className="border-l-4 border-l-blue-600">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">MRR (Ingreso Mensual)</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-heading">
              ${mrr.toLocaleString()} <span className="text-sm font-semibold text-slate-500">MXN</span>
            </h3>
            <span className="text-[11px] text-blue-600 font-semibold inline-flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> Facturación SaaS Recurrente
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </Card>

      {/* ARR Card */}
      <Card elevation="hover" className="border-l-4 border-l-emerald-600">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">ARR (Proyección Anual)</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-heading">
              ${arr.toLocaleString()} <span className="text-sm font-semibold text-slate-500">MXN</span>
            </h3>
            <span className="text-[11px] text-emerald-600 font-semibold inline-flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> Proyección de 12 Meses
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </Card>

      {/* Fraccionamientos Activos */}
      <Card elevation="hover" className="border-l-4 border-l-indigo-600">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Fraccionamientos Activos</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-heading">
              {activeTenants}
            </h3>
            <span className="text-[11px] text-indigo-600 font-semibold inline-flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3 h-3" /> Aislamiento por Schema
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </Card>

      {/* Total Casas Administradas */}
      <Card elevation="hover" className="border-l-4 border-l-purple-600">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Casas Totales Gestionadas</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-heading">
              {totalHouses}
            </h3>
            <span className="text-[11px] text-purple-600 font-medium inline-flex items-center gap-1 mt-1">
              <Home className="w-3 h-3" /> Límite duro acumulado
            </span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Home className="w-6 h-6" />
          </div>
        </div>
      </Card>

      {/* Churn Rate Card */}
      <Card elevation="hover" className="border-l-4 border-l-teal-600">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Tasa de Churn (Cancelaciones)</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-heading">
              {churnRate}%
            </h3>
            <span className="text-[11px] text-teal-600 font-medium inline-flex items-center gap-1 mt-1">
              <Activity className="w-3 h-3" /> 100% Retención en plataforma
            </span>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </Card>

      {/* Gateways IoT Online */}
      <Card elevation="hover" className="border-l-4 border-l-amber-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Casetas IoT en Línea</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-heading">
              {onlineGateways} / {totalGateways || onlineGateways}
            </h3>
            <span className="text-[11px] text-amber-600 font-medium inline-flex items-center gap-1 mt-1">
              <Radio className="w-3 h-3" /> Broker EMQX (MQTT 1883)
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Radio className="w-6 h-6" />
          </div>
        </div>
      </Card>
    </div>
  );
}
