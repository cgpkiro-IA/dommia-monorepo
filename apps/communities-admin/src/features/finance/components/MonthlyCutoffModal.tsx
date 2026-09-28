'use client';

import React from 'react';
import { Button } from '@dommia/ui';
import { X, Calendar, Play, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface MonthlyCutoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: { year: number; month: number; dryRun: boolean };
  onChange: (field: string, value: any) => void;
  onExecute: () => void;
  loading: boolean;
  result: any | null;
}

const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

export function MonthlyCutoffModal({
  isOpen,
  onClose,
  form,
  onChange,
  onExecute,
  loading,
  result,
}: MonthlyCutoffModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-100 p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-blue-600 uppercase">
                Motor de Cobranza Mensual
              </span>
              <h2 className="text-lg md:text-xl font-black text-slate-900 font-heading">
                Emisión de Cobranza del Período
              </h2>
              <p className="text-xs text-slate-500">
                Genera los cargos mensuales a todas las viviendas conforme a las cuotas activas.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mes de Cobranza *
              </label>
              <select
                value={form.month}
                onChange={(e) => onChange('month', parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Año *
              </label>
              <select
                value={form.year}
                onChange={(e) => onChange('year', parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          {/* Dry Run Checkbox */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.dryRun}
                onChange={(e) => onChange('dryRun', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">
                  Simulación de corte (Dry Run / Sin alterar base de datos)
                </span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Calcula el número de cargos y la recaudación total proyectada sin guardar registros definitivos.
                </span>
              </div>
            </label>
          </div>

          {/* Results card if simulated */}
          {result && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase">
                <span>Resultado de Simulación</span>
                <span className="font-mono text-blue-600 font-extrabold">{result.monthName} {result.year}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Cargos a Generar</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {result.chargesCount}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Recaudación Proyectada</span>
                  <span className="text-base font-bold text-emerald-600 font-mono">
                    ${Number(result.totalProjectedAmount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cerrar
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={onExecute}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-sm"
          >
            {loading ? (
              'Procesando...'
            ) : form.dryRun ? (
              <>
                <Play className="w-4 h-4 mr-1.5" />
                Ejecutar Simulación
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Emitir Cobranza Definitiva
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
