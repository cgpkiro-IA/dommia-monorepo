'use client';

import React from 'react';
import { Card, Button } from '@dommia/ui';
import {
  Calendar,
  Clock,
  AlertTriangle,
  Sparkles,
  Edit2,
  Trash2,
  Play,
  CheckCircle2,
  XCircle,
  Building,
} from 'lucide-react';
import { FeeConfiguration } from '@/types';

interface FeeConfigCardProps {
  fee: FeeConfiguration;
  onEdit: (fee: FeeConfiguration) => void;
  onToggleActive: (fee: FeeConfiguration) => void;
  onDelete: (id: string) => void;
  onSimulate: (id: string) => void;
}

export function FeeConfigCard({
  fee,
  onEdit,
  onToggleActive,
  onDelete,
  onSimulate,
}: FeeConfigCardProps) {
  const isVariableLot = fee.fee_type === 'VARIABLE_LOT_SIZE';
  const isExtraordinary = fee.fee_type === 'EXTRAORDINARY';

  const typeBadgeConfig = {
    FIXED_RECURRENT: {
      label: 'Cuota Fija Ordinaria',
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    VARIABLE_LOT_SIZE: {
      label: 'Variable por m² de Lote',
      className: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    EXTRAORDINARY: {
      label: 'Cuota Extraordinaria',
      className: 'bg-amber-100 text-amber-800 border-amber-200',
    },
  }[fee.fee_type] || {
    label: fee.fee_type,
    className: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const frequencyLabel = {
    MONTHLY: 'Mensual',
    BI_MONTHLY: 'Bimestral',
    ANNUAL: 'Anual',
    ONE_TIME: 'Pago Único',
  }[fee.frequency] || fee.frequency;

  return (
    <Card
      elevation="hover"
      className={`relative flex flex-col justify-between p-5 border transition-all duration-200 ${
        fee.is_active
          ? 'bg-white border-slate-200 shadow-xs'
          : 'bg-slate-50/70 border-slate-200/60 opacity-75'
      }`}
    >
      <div className="space-y-4">
        {/* Header & Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${typeBadgeConfig.className}`}
              >
                {typeBadgeConfig.label}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                {frequencyLabel}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 font-heading leading-snug">
              {fee.name}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onToggleActive(fee)}
            title={fee.is_active ? 'Desactivar cuota' : 'Activar cuota'}
            className="cursor-pointer transition-transform hover:scale-105 shrink-0"
          >
            {fee.is_active ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Activa
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                <XCircle className="w-3.5 h-3.5 text-slate-400" />
                Inactiva
              </span>
            )}
          </button>
        </div>

        {/* Pricing Display */}
        <div className="pt-2 pb-1 border-t border-slate-100 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
            ${Number(fee.base_amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {isVariableLot ? 'MXN / m²' : 'MXN por vivienda'}
          </span>
        </div>

        {fee.description && (
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {fee.description}
          </p>
        )}

        {/* Rules & Parameters Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-500" /> Vencimiento
            </span>
            <p className="font-bold text-slate-800">
              Día {fee.due_day} de mes
            </p>
            <span className="text-[10px] text-slate-500">
              +{fee.grace_days} días de gracia
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" /> Recargo Mora
            </span>
            {fee.late_fee_type === 'NONE' ? (
              <p className="font-medium text-slate-500">Sin recargo</p>
            ) : (
              <p className="font-bold text-amber-800">
                {fee.late_fee_type === 'PERCENTAGE'
                  ? `+${fee.late_fee_amount}% recargo`
                  : `+$${Number(fee.late_fee_amount).toFixed(2)} fijo`}
              </p>
            )}
            <span className="text-[10px] text-slate-500">
              Tras límite de gracia
            </span>
          </div>

          {fee.early_bird_discount_type !== 'NONE' && (
            <div className="col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" /> Pronto Pago:
              </span>
              <span className="text-xs font-bold text-emerald-800">
                {fee.early_bird_discount_type === 'PERCENTAGE'
                  ? `-${fee.early_bird_discount_amount}%`
                  : `-$${Number(fee.early_bird_discount_amount).toFixed(2)}`}
                {' '}(antes del día {fee.early_bird_deadline_day || 5})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSimulate(fee.id)}
          className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50 font-bold"
        >
          <Play className="w-3.5 h-3.5 mr-1 text-blue-600 fill-blue-600" />
          Simular Cobro en Lotes
        </Button>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(fee)}
            className="text-slate-600 hover:text-blue-600 p-2"
            title="Editar cuota"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(fee.id)}
            className="text-slate-400 hover:text-red-600 p-2"
            title="Eliminar cuota"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
