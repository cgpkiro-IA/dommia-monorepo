'use client';

import React from 'react';
import { PlanItem } from '../../../types';
import { PlansGrid } from './PlansGrid';

interface PlansViewProps {
  plans: PlanItem[];
  onEditPlan: (plan: PlanItem) => void;
}

export function PlansView({ plans, onEditPlan }: PlansViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
            Configuración de Planes SaaS, Tiers y Módulos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Control comercial y de monetización en vivo. Configura límites duros de viviendas, precios y la política de subdominio estándar vs personalizado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg font-medium">
            {plans.length} Planes Activos en Catálogo
          </span>
        </div>
      </div>

      <PlansGrid plans={plans} onEditPlan={onEditPlan} />
    </div>
  );
}
