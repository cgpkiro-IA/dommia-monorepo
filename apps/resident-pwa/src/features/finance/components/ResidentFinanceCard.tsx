'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  RefreshCw,
  Landmark,
  Building2,
  Receipt,
} from 'lucide-react';
import { ResidentProfile, ResidentFinancialStatus, ResidentPayment } from '../../../types';
import { ReceiptDetailsModal } from './ReceiptDetailsModal';

interface ResidentFinanceCardProps {
  profile: ResidentProfile;
  financialStatus: ResidentFinancialStatus | null;
  isLoading: boolean;
  onOpenSpeiModal: () => void;
  onRefresh: () => void;
}

export const ResidentFinanceCard: React.FC<ResidentFinanceCardProps> = ({
  profile,
  financialStatus,
  isLoading,
  onOpenSpeiModal,
  onRefresh,
}) => {
  const [selectedReceipt, setSelectedReceipt] = useState<ResidentPayment | null>(null);

  const balanceDue = financialStatus ? Number(financialStatus.totalBalanceDue) : 0;
  const isUpToDate = balanceDue <= 0;
  const charges = financialStatus?.charges || [];
  const payments = financialStatus?.recentPayments || [];

  return (
    <div className="mx-4 mb-6 space-y-4">
      {/* Main Balance Card */}
      <div className="p-5 rounded-3xl bg-slate-900/95 border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div
          className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none ${
            isUpToDate ? 'bg-emerald-500/10' : 'bg-rose-500/10'
          }`}
        />

        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white font-heading">
                Estado de Cuenta
              </h3>
              <p className="text-[11px] text-slate-400">{profile.propertyAddress}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 transition-transform ${
                isLoading ? 'animate-spin' : ''
              }`}
              title="Actualizar saldo"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                isUpToDate
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-rose-950 text-rose-300 border-rose-800'
              }`}
            >
              {isUpToDate ? 'Al Corriente' : 'Saldo Pendiente'}
            </span>
          </div>
        </div>

        {/* Balance Display */}
        <div className="mb-4">
          <p className="text-xs text-slate-400">Total a Pagar:</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <p
              className={`text-3xl font-black font-heading ${
                isUpToDate ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              ${balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-slate-400 font-normal">MXN</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isUpToDate
              ? '✓ No tienes cuotas pendientes ni cargos vencidos.'
              : `Tienes ${financialStatus?.pendingChargesCount || 1} concepto(s) pendientes de liquidar.`}
          </p>
        </div>

        {/* Breakdown of pending charges */}
        {!isUpToDate && charges.length > 0 && (
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/90 mb-4 space-y-2 text-xs">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Desglose de Cargos:
            </p>
            {charges
              .filter((c) => Number(c.balance_due) > 0)
              .map((charge) => (
                <div key={charge.id} className="flex justify-between items-center py-1 border-b border-slate-800/60 last:border-b-0">
                  <div className="truncate pr-2 max-w-[200px]">
                    <p className="text-slate-200 font-medium truncate">{charge.concept}</p>
                    <p className="text-[10px] text-slate-500">
                      Vencimiento: {new Date(charge.due_date).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <span className="font-bold text-rose-400 whitespace-nowrap">
                    ${Number(charge.balance_due).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* Primary Payment Action: SPEI and Ventanilla Cash */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenSpeiModal}
            className="py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/40 cursor-pointer"
          >
            <Landmark className="w-4 h-4 shrink-0" />
            <span className="truncate">Pagar vía SPEI</span>
          </button>

          <button
            type="button"
            onClick={() =>
              alert(
                'Pago en Ventanilla (Efectivo):\n\nAcude a las oficinas de administración del fraccionamiento en horario de 9:00 a 18:00 hrs.\n\nEl administrador registrará tu pago en efectivo y recibirás una alerta inmediata en esta PWA confirmando tu recibo digital y estado Al Corriente.'
              )
            }
            className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Pago en Efectivo</span>
          </button>
        </div>
      </div>

      {/* Payment History List */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 text-white shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Recibos y Pagos Acreditados
            </h4>
          </div>
          <span className="text-[10px] text-slate-400">{payments.length} registro(s)</span>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No se han registrado pagos recientes para esta vivienda.
          </div>
        ) : (
          <div className="space-y-2.5">
            {payments.slice(0, 4).map((payment) => (
              <div
                key={payment.id}
                onClick={() => setSelectedReceipt(payment)}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer text-xs"
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {payment.payment_method === 'CASH' ? 'Efectivo' : 'SPEI'}
                    </span>
                    <span className="font-semibold text-slate-200">{payment.reference}</span>
                  </div>
                  <span className="font-black text-emerald-400">
                    +${Number(payment.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>
                    {payment.paid_at
                      ? new Date(payment.paid_at).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Fecha reciente'}
                  </span>
                  <span className="text-slate-300 truncate max-w-[150px]">
                    {payment.received_by_name || 'Administración'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Render externalized receipt details modal */}
      <ReceiptDetailsModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
};
