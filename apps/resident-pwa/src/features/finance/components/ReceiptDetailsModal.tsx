'use client';

import React from 'react';
import { Receipt } from 'lucide-react';
import { ResidentPayment } from '../../../types';

interface ReceiptDetailsModalProps {
  receipt: ResidentPayment | null;
  onClose: () => void;
}

export const ReceiptDetailsModal: React.FC<ReceiptDetailsModalProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-5 text-white shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h4 className="font-bold text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            Recibo Digital Oficial
          </h4>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 uppercase font-semibold">Folio: {receipt.reference}</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            ${Number(receipt.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </p>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
            PAGO RECIBIDO Y ACREDITADO
          </span>
        </div>

        <div className="space-y-2 text-xs text-slate-300 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
          <div className="flex justify-between">
            <span className="text-slate-400">Método:</span>
            <span className="font-semibold text-white">
              {receipt.payment_method === 'CASH' ? 'Efectivo en Ventanilla' : 'SPEI'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Atendido por:</span>
            <span className="font-semibold text-white truncate max-w-[160px]">
              {receipt.received_by_name || 'Administración'}
            </span>
          </div>
          {receipt.notes && (
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 italic">
              "{receipt.notes}"
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
