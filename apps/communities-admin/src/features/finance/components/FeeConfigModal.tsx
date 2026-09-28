'use client';

import { Button } from '@dommia/ui';

import { X, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { FeeFormData, FeeType, FeeFrequency, LateFeeType, EarlyBirdDiscountType } from '@/types';

interface FeeConfigModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: FeeFormData;
  formError: string | null;
  loading: boolean;
  onClose: () => void;
  onChange: (data: Partial<FeeFormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function FeeConfigModal({
  isOpen,
  isEditing,
  formData,
  formError,
  loading,
  onClose,
  onChange,
  onSubmit,
}: FeeConfigModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100 p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-wider text-blue-600 uppercase">
              Dommia Finance • Configuración
            </span>
            <h2 className="text-xl font-black text-slate-900 font-heading">
              {isEditing ? 'Editar Estructura de Cuota' : 'Nueva Estructura de Cuota'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Define las reglas de cobro, vencimiento, recargos por mora y descuentos por pronto pago.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Nombre y Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">Nombre del Concepto *</label>
              <input
                type="text"
                placeholder="Ej. Cuota Ordinaria de Mantenimiento Mensual"
                value={formData.name}
                onChange={(e) => onChange({ name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                required
              />
            </div>


            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Tipo de Cuota *</label>
              <select
                value={formData.feeType}
                onChange={(e) => onChange({ feeType: e.target.value as FeeType })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="FIXED_RECURRENT">Cuota Fija Regular (Por Vivienda)</option>
                <option value="VARIABLE_LOT_SIZE">Variable según Metraje de Lote (m²)</option>
                <option value="EXTRAORDINARY">Cuota Extraordinaria Especial</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Frecuencia de Cobro *</label>
              <select
                value={formData.frequency}
                onChange={(e) => onChange({ frequency: e.target.value as FeeFrequency })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="MONTHLY">Mensual</option>
                <option value="BI_MONTHLY">Bimestral</option>
                <option value="ANNUAL">Anual</option>
                <option value="ONE_TIME">Pago Único</option>
              </select>
            </div>
          </div>

          {/* Monto Base y Calendario */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                {formData.feeType === 'VARIABLE_LOT_SIZE' ? 'Monto por m² (MXN) *' : 'Monto Base (MXN) *'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.baseAmount}
                  onChange={(e) => onChange({ baseAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Día de Vencimiento *</label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.dueDay}
                onChange={(e) => onChange({ dueDay: parseInt(e.target.value, 10) || 10 })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                required
              />
              <span className="text-[10px] text-slate-500">Día del mes (1 al 31)</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Días de Gracia *</label>
              <input
                type="number"
                min="0"
                max="30"
                value={formData.graceDays}
                onChange={(e) => onChange({ graceDays: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                required
              />
              <span className="text-[10px] text-slate-500">Tolerancia antes de mora</span>
            </div>
          </div>

          {/* Políticas de Recargo y Pronto Pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recargo por mora */}
            <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 space-y-3">
              <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Política de Recargo por Mora
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Tipo de Recargo</label>
                  <select
                    value={formData.lateFeeType}
                    onChange={(e) => onChange({ lateFeeType: e.target.value as LateFeeType })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    <option value="NONE">Sin recargo</option>
                    <option value="PERCENTAGE">Porcentaje (%)</option>
                    <option value="FIXED">Monto Fijo ($)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">
                    {formData.lateFeeType === 'PERCENTAGE' ? 'Porcentaje (%)' : 'Monto ($)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={formData.lateFeeType === 'NONE'}
                    value={formData.lateFeeAmount}
                    onChange={(e) => onChange({ lateFeeAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-bold disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Descuento pronto pago */}
            <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 space-y-3">
              <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Descuento por Pronto Pago
              </h4>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Tipo</label>
                  <select
                    value={formData.earlyBirdDiscountType}
                    onChange={(e) => onChange({ earlyBirdDiscountType: e.target.value as EarlyBirdDiscountType })}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    <option value="NONE">Ninguno</option>
                    <option value="PERCENTAGE">% Porc.</option>
                    <option value="FIXED">$ Fijo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={formData.earlyBirdDiscountType === 'NONE'}
                    value={formData.earlyBirdDiscountAmount}
                    onChange={(e) => onChange({ earlyBirdDiscountAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-bold disabled:bg-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Antes del día</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    disabled={formData.earlyBirdDiscountType === 'NONE'}
                    value={formData.earlyBirdDeadlineDay || 5}
                    onChange={(e) => onChange({ earlyBirdDeadlineDay: parseInt(e.target.value, 10) || 5 })}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-bold disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Descripción / Justificación de la Cuota</label>
            <textarea
              rows={2}
              placeholder="Detalla qué conceptos o servicios de áreas comunes cubre esta cuota..."
              value={formData.description || ''}
              onChange={(e) => onChange({ description: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
            >
              {loading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Estructura de Cuota'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
