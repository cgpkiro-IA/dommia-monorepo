'use client';

import React from 'react';
import { Button } from '@dommia/ui';
import { X, Calculator, DollarSign, Home, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import { FeeSimulationResult } from '@/types';

interface FeeSimulationModalProps {
  isOpen: boolean;
  simulation: FeeSimulationResult | null;
  onClose: () => void;
}

export function FeeSimulationModal({
  isOpen,
  simulation,
  onClose,
}: FeeSimulationModalProps) {
  if (!isOpen || !simulation) return null;

  const { feeSummary, projection, propertiesSample } = simulation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-100 p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-600 uppercase flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5" /> Motor de Simulación Financiera
            </span>
            <h2 className="text-xl font-black text-slate-900 font-heading mt-0.5">
              Simulación de Cobranza: {feeSummary.name}
            </h2>
            <p className="text-xs text-slate-500">
              Proyección de recaudación basada en el padrón actual de viviendas y las reglas de cuota configuradas.
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

        {/* Projection KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Lotes Simulados</span>
            <span className="text-2xl font-black text-slate-900 font-heading mt-1 block">
              {projection.totalPropertiesCount}
            </span>
            <span className="text-[10px] text-slate-500">Viviendas activas</span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
            <span className="text-[10px] uppercase font-bold text-blue-600 block">Ingreso Base</span>
            <span className="text-2xl font-black text-blue-900 font-heading mt-1 block">
              ${projection.projectedBaseRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-blue-600">Al corriente puntual</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Pronto Pago</span>
            <span className="text-2xl font-black text-emerald-900 font-heading mt-1 block">
              ${projection.projectedEarlyBirdRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-emerald-600">Con descuento</span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-amber-600 block">Con Mora</span>
            <span className="text-2xl font-black text-amber-900 font-heading mt-1 block">
              ${projection.projectedLateRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-amber-600">Con recargos</span>
          </div>
        </div>

        {/* Parameter Rules Summary */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-slate-500">Vencimiento: </span>
            <span className="font-bold text-slate-800">Día {feeSummary.dueDay} (tolerancia +{feeSummary.graceDays} días)</span>
          </div>
          <div>
            <span className="text-slate-500">Recargo Mora: </span>
            <span className="font-bold text-amber-700">{feeSummary.lateFeePolicy}</span>
          </div>
          <div>
            <span className="text-slate-500">Pronto Pago: </span>
            <span className="font-bold text-emerald-700">{feeSummary.earlyBirdPolicy}</span>
          </div>
        </div>

        {/* Sample Breakdown Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Desglose Muestral por Vivienda
            </h4>
            <span className="text-[11px] text-slate-500">
              Promedio: ${projection.averageFeePerProperty.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN / lote
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-2.5 px-3">Dirección</th>
                  <th className="py-2.5 px-3">Metraje (m²)</th>
                  <th className="py-2.5 px-3 text-right">Cuota Base</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700">Pronto Pago</th>
                  <th className="py-2.5 px-3 text-right text-amber-700">Con Mora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {propertiesSample.map((p) => (
                  <tr key={p.propertyId} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {p.address}
                      {p.isDelinquent && (
                        <span className="ml-2 text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                          Moroso
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">
                      {p.lotSizeM2} m²
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      ${p.baseFee.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                      ${p.earlyBirdTotal.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-600">
                      ${p.lateTotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="cursor-pointer font-bold"
          >
            Cerrar Simulación
          </Button>
        </div>
      </div>
    </div>
  );
}
