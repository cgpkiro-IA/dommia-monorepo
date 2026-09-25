'use client';

import React from 'react';
import { CheckCircle2, Receipt, ShieldCheck, X, Building2, User, Calendar } from 'lucide-react';
import { ResidentPayment } from '../../../types';

interface PaymentAlertModalProps {
  payment: ResidentPayment | null;
  onClose: () => void;
}

export const PaymentAlertModal: React.FC<PaymentAlertModalProps> = ({ payment, onClose }) => {
  if (!payment) return null;

  const formattedAmount = Number(payment.amount).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedDate = payment.paid_at
    ? new Date(payment.paid_at).toLocaleString('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Hoy';

  const isCash = payment.payment_method === 'CASH';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-emerald-500/40 p-6 text-white shadow-2xl shadow-emerald-950/50"
      >
        {/* Glow decoration */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors"
          aria-label="Cerrar alerta"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 ring-8 ring-emerald-500/10 animate-bounce">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800/80 tracking-wide mb-1.5">
            ¡Pago Acreditado!
          </span>
          <h3 className="text-lg font-black text-white font-heading">
            {isCash ? 'Cobro en Ventanilla Registrado' : 'Pago Bancario Acreditado'}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Administración ha confirmado y procesado tu pago satisfactoriamente.
          </p>
        </div>

        {/* Amount Box */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center mb-4">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Monto Pagado
          </p>
          <p className="text-3xl font-black text-emerald-400 font-heading mt-0.5">
            ${formattedAmount} <span className="text-sm font-normal text-slate-400">MXN</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-1">
            <Receipt className="w-3.5 h-3.5 text-blue-400" />
            <span>Folio: <strong className="text-slate-200">{payment.reference}</strong></span>
          </p>
        </div>

        {/* Details List */}
        <div className="space-y-2 text-xs text-slate-300 mb-5 bg-slate-800/40 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              Método:
            </span>
            <span className="font-semibold text-slate-200">
              {isCash ? '💵 Efectivo en Ventanilla' : '🏦 Transferencia SPEI'}
            </span>
          </div>

          {payment.received_by_name && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Atendido por:
              </span>
              <span className="font-semibold text-slate-200 text-right truncate max-w-[170px]">
                {payment.received_by_name}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Fecha y Hora:
            </span>
            <span className="font-medium text-slate-300 text-right">{formattedDate}</span>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-emerald-400">
            <span className="flex items-center gap-1 font-semibold text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Estatus de Vivienda:
            </span>
            <span className="font-black text-[11px] uppercase tracking-wider">
              Al Corriente
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Entendido, Cerrar Aviso</span>
        </button>
      </div>
    </div>
  );
};
