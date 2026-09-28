'use client';

import React from 'react';
import { Search, Check, ExternalLink, X } from 'lucide-react';
import { FinancialPayment, PaymentMethod } from '@/types';

interface PaymentsHistoryTableProps {
  payments: FinancialPayment[];
  filterSearch: string;
  onSearchChange: (value: string) => void;
  filterMethod: PaymentMethod | 'ALL';
  onMethodChange: (method: PaymentMethod | 'ALL') => void;
  onReview: (paymentId: string, status: 'APPROVED' | 'REJECTED') => void;
}

export function PaymentsHistoryTable({
  payments,
  filterSearch,
  onSearchChange,
  filterMethod,
  onMethodChange,
  onReview,
}: PaymentsHistoryTableProps) {
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
            placeholder="Buscar por folio, pagador o calle..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Método:</span>
          {(['ALL', 'CASH', 'SPEI_TRANSFER', 'BANK_DEPOSIT'] as const).map((m) => (
            <button
              key={m}
              onClick={() => onMethodChange(m)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMethod === m
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m === 'ALL' ? 'Todos' : m === 'CASH' ? 'Efectivo' : m === 'SPEI_TRANSFER' ? 'SPEI' : 'Depósito'}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-100">
            <tr>
              <th className="py-3 px-4">Folio Recibo</th>
              <th className="py-3 px-4">Vivienda & Pagador</th>
              <th className="py-3 px-4">Concepto Acreditado</th>
              <th className="py-3 px-4">Método</th>
              <th className="py-3 px-4">Monto Acreditado</th>
              <th className="py-3 px-4">Fecha & Hora</th>
              <th className="py-3 px-4">Recibido por</th>
              <th className="py-3 px-4">Validación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-mono font-bold text-blue-600 block">{p.reference}</span>
                  <span className={`text-[10px] font-semibold ${p.status === 'PENDING_APPROVAL' ? 'text-amber-600' : p.status === 'REJECTED' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {p.status === 'PENDING_APPROVAL' ? 'Pendiente de validación' : p.status === 'REJECTED' ? 'Rechazado' : '✓ Acreditado'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-bold text-slate-900 block">
                    {p.street} #{p.exterior_number}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {p.payer_name || 'Titular de vivienda'}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-700">
                  {p.charge_concept || 'Abono general a cuenta'}
                </td>
                <td className="py-3 px-4">
                  {p.payment_method === 'CASH' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      💵 Efectivo en Ventanilla
                    </span>
                  ) : p.payment_method === 'SPEI_TRANSFER' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                      🏦 SPEI
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {p.payment_method}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 font-mono font-black text-slate-900 text-sm">
                  ${Number(p.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                  {new Date(p.paid_at).toLocaleString('es-MX')}
                </td>
                <td className="py-3 px-4 text-slate-600 text-[11px]">
                  {p.received_by_name || 'Pendiente'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    {p.receipt_url && (
                      <button
                        type="button"
                        onClick={() => window.open(p.receipt_url || '', '_blank', 'noopener,noreferrer')}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                      >
                        <ExternalLink className="h-3 w-3" /> Ver
                      </button>
                    )}
                    {p.status === 'PENDING_APPROVAL' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onReview(p.id, 'APPROVED')}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
                        >
                          <Check className="h-3 w-3" /> Aprobar
                        </button>
                        <button
                          type="button"
                          onClick={() => onReview(p.id, 'REJECTED')}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-50"
                        >
                          <X className="h-3 w-3" /> Rechazar
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  No se han registrado pagos en ventanilla aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
