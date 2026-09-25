'use client';

import React from 'react';
import { Button } from '@dommia/ui';
import { Search } from 'lucide-react';
import { FinancialCharge, ChargeStatus } from '@/types';

interface MonthlyChargesTableProps {
  charges: FinancialCharge[];
  filterSearch: string;
  onSearchChange: (value: string) => void;
  filterStatus: ChargeStatus | 'ALL';
  onStatusChange: (status: ChargeStatus | 'ALL') => void;
  onCollectInCash: (propertyId: string, chargeId: string, amount: number) => void;
}

export function MonthlyChargesTable({
  charges,
  filterSearch,
  onSearchChange,
  filterStatus,
  onStatusChange,
  onCollectInCash,
}: MonthlyChargesTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filterSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar vivienda, residente o concepto..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Filtrar:</span>
          {(['ALL', 'PENDING', 'PAID', 'PARTIAL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => onStatusChange(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'Todos' : st === 'PENDING' ? 'Pendientes' : st === 'PAID' ? 'Pagados' : 'Parciales'}
            </button>
          ))}
        </div>
      </div>

      {/* Charges Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-100">
            <tr>
              <th className="py-3 px-4">Vivienda & Residente</th>
              <th className="py-3 px-4">Concepto de Cobro</th>
              <th className="py-3 px-4">Vencimiento</th>
              <th className="py-3 px-4">Monto Total</th>
              <th className="py-3 px-4">Saldo Pendiente</th>
              <th className="py-3 px-4">Estatus</th>
              <th className="py-3 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {charges.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-bold text-slate-900 block">
                    {c.street} #{c.exterior_number} {c.interior_number ? `Int. ${c.interior_number}` : ''}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {c.primary_resident_name || 'Sin titular registrado'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium text-slate-800">{c.concept}</span>
                </td>
                <td className="py-3 px-4 font-mono text-slate-600">
                  {new Date(c.due_date).toLocaleDateString('es-MX')}
                </td>
                <td className="py-3 px-4 font-mono font-bold text-slate-900">
                  ${Number(c.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 font-mono font-bold">
                  <span className={Number(c.balance_due || c.amount) > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                    ${Number(c.balance_due ?? c.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {c.status === 'PAID' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      PAGADO
                    </span>
                  ) : c.status === 'PARTIAL' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                      PARCIAL
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                      PENDIENTE
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  {c.status !== 'PAID' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onCollectInCash(c.property_id, c.id, Number(c.balance_due || c.amount))}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 text-[11px] font-bold cursor-pointer py-1 px-2.5"
                    >
                      Cobrar en Ventanilla
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {charges.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No hay cargos emitidos con los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
